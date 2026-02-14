import Anthropic from '@anthropic-ai/sdk';
import type { Server as SocketServer } from 'socket.io';
import { eq } from 'drizzle-orm';
import { db } from '../services/database.js';
import { tasks, steps, messages, projects, files as filesTable } from '../../../shared/schema.js';
import type { StepUpdate, TaskPlan, ToolResult, ServerEvent } from '../../../shared/types.js';
import { SupabaseSandbox } from './supabase-sandbox.js';
import { FileSystemTool } from '../tools/filesystem.js';
import { TerminalTool } from '../tools/terminal.js';
import { BrowserTool } from '../tools/browser.js';
import { SearchTool } from '../tools/search.js';
import { DeployTool } from '../tools/deploy.js';

const MAX_ITERATIONS = 50;

const SYSTEM_PROMPT = `You are Masidy Agent — an autonomous AI software engineer and creative partner. You build beautiful, production-quality web applications. You're friendly, proactive, and always thinking about what would make the project even better.

## Your Personality
- Talk like a helpful friend, not a formal bot. Be warm, encouraging, and genuinely excited about what the user is building.
- Proactively suggest improvements — don't just do what's asked, think about what would make the result exceptional.
- When you finish a build, offer 2-3 specific ideas to enhance it (e.g., "This looks great! Want me to add smooth page transitions or a dark mode toggle?").
- Use brief, friendly messages. Celebrate milestones ("Nice — your landing page is looking sharp!").
- If something fails, be reassuring: "No worries, let me fix that real quick."

## Your Workflow
1. PLAN — use the plan tool to create a clear, structured execution plan
2. EXECUTE each step using the available tools
3. If errors occur, DEBUG by reading error messages and fixing issues
4. VERIFY by running the app and browsing the result to ensure quality
5. SUMMARIZE what you built and suggest improvements

## Quality Standards
- Build PREMIUM, modern UIs — clean typography, proper spacing, subtle animations, hover effects
- Use modern CSS: flexbox/grid, smooth transitions, responsive design by default
- Always add meta viewport tag for mobile responsiveness
- Include loading states, hover interactions, and micro-animations
- Write clean, well-organized, production-ready code
- Use semantic HTML and accessible markup

## Free Resources to Use (proactively integrate these)
- **Fonts**: Use Google Fonts CDN — recommended: Inter, DM Sans, Plus Jakarta Sans, Poppins, Space Grotesk
  - Example: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
- **Icons**: Use Lucide CDN, Heroicons, or Phosphor Icons via unpkg/CDN
  - Example: <script src="https://unpkg.com/lucide@latest"></script>
- **CSS Frameworks**: Consider Tailwind CDN for rapid styling
  - Example: <script src="https://cdn.tailwindcss.com"></script>
- **Images**: Use Unsplash for placeholder/stock photos
  - Example: https://images.unsplash.com/photo-{id}?w=800&auto=format
  - Common sizes: ?w=400, ?w=800, ?w=1200
- **Gradients**: Use modern gradient backgrounds — linear-gradient with 2-3 colors
- **Animations**: Use CSS @keyframes for entrance animations, hover transitions, and loading states
- **Color palettes**: Use harmonious color schemes — warm neutrals, indigo/violet accents, emerald greens

## Rules
- Always create a plan before starting implementation
- Write production-quality, well-structured code
- Don't give up on the first error — read the error, think about it, and try to fix it
- Test by running the application
- Install dependencies before using them (npm install, pip install, etc.)
- Ask the user if you need clarification on requirements
- Use think tool when facing complex decisions
- Create files directly in /workspace (e.g. /workspace/index.html, /workspace/css/styles.css) — do NOT create a project subdirectory like /workspace/my-project/
- Prefer using write_file over terminal commands for creating files and directories
- When building HTML pages, always include a favicon, proper meta tags, and Open Graph tags
- Make everything responsive and mobile-friendly by default
- Add subtle animations: fade-ins, slide-ups, scale transitions on hover
- Use a consistent, professional color scheme throughout`;

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'plan',
    description: 'Create an execution plan for the task. Always call this first before implementing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        goal: { type: 'string', description: 'The overall goal to achieve' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: {
                type: 'string',
                enum: ['code', 'terminal', 'browser', 'file_write', 'file_read', 'search', 'deploy', 'think'],
              },
              description: { type: 'string' },
            },
            required: ['title', 'type', 'description'],
          },
        },
        estimatedTime: { type: 'string', description: 'Estimated time to complete' },
      },
      required: ['goal', 'steps'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates directories automatically. Path relative to /workspace.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path (relative to /workspace or absolute)' },
        content: { type: 'string', description: 'File content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Directory path', default: '/workspace' },
        recursive: { type: 'boolean', description: 'List recursively', default: false },
      },
      required: [],
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command in the sandbox. Commands run from /workspace directory.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        timeout: { type: 'number', description: 'Timeout in ms (default 120000)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'search_web',
    description: 'Search the web for information.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'browse',
    description: 'Control a web browser. Use to navigate, screenshot, click, type, scroll, or wait.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['navigate', 'screenshot', 'click', 'type', 'scroll', 'wait'],
          description: 'Browser action to perform',
        },
        url: { type: 'string', description: 'URL to navigate to (for navigate action)' },
        selector: { type: 'string', description: 'CSS selector (for click/type actions)' },
        text: { type: 'string', description: 'Text to type (for type action)' },
        waitTime: { type: 'number', description: 'Milliseconds to wait (for wait action)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'deploy',
    description: 'Build and deploy the application.',
    input_schema: {
      type: 'object' as const,
      properties: {
        buildCommand: { type: 'string', description: 'Build command (e.g., npm run build)' },
        startCommand: { type: 'string', description: 'Start command (e.g., npm start)' },
        port: { type: 'number', description: 'Application port (default 3000)' },
      },
      required: [],
    },
  },
  {
    name: 'ask_user',
    description: 'Ask the user a question and wait for their response. Use when you need clarification.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string', description: 'Question to ask the user' },
      },
      required: ['question'],
    },
  },
  {
    name: 'think',
    description: 'Think step by step about a problem. Use for complex reasoning before acting.',
    input_schema: {
      type: 'object' as const,
      properties: {
        thought: { type: 'string', description: 'Your reasoning and analysis' },
      },
      required: ['thought'],
    },
  },
];

export class AgentOrchestrator {
  private io: SocketServer;
  private projectId: string;
  private taskId: string | null = null;
  private projectSlug: string;
  private sandbox: SupabaseSandbox;
  private fsTool: FileSystemTool;
  private terminalTool: TerminalTool;
  private browserTool: BrowserTool;
  private searchTool: SearchTool;
  private deployTool: DeployTool;
  private anthropic: Anthropic;
  private cancelled = false;
  private paused = false;
  private pauseResolver: ((answer: string) => void) | null = null;
  private stepIndex = 0;
  private startTime = 0;
  private totalTokens = 0;

  constructor(io: SocketServer, projectId: string, projectSlug: string) {
    this.io = io;
    this.projectId = projectId;
    this.projectSlug = projectSlug;
    this.sandbox = new SupabaseSandbox(projectId);
    this.fsTool = new FileSystemTool(this.sandbox);
    this.terminalTool = new TerminalTool(this.sandbox);
    this.browserTool = new BrowserTool();
    this.searchTool = new SearchTool();
    this.deployTool = new DeployTool(this.sandbox, projectSlug, projectId);
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async execute(prompt: string): Promise<void> {
    this.startTime = Date.now();

    // Create task in DB
    const [task] = await db
      .insert(tasks)
      .values({
        projectId: this.projectId,
        prompt,
        status: 'planning',
      })
      .returning();

    this.taskId = task.id;

    // Emit task started
    this.emit({ type: 'task:started', taskId: task.id, projectId: this.projectId });

    try {
      // Start sandbox
      const containerId = await this.sandbox.start();
      await db
        .update(projects)
        .set({ containerId })
        .where(eq(projects.id, this.projectId));

      // Run the agent loop
      await this.agentLoop(prompt);

      // Success
      const duration = Date.now() - this.startTime;
      await db
        .update(tasks)
        .set({
          status: 'completed',
          tokensUsed: this.totalTokens,
          durationMs: duration,
          completedAt: new Date(),
        })
        .where(eq(tasks.id, task.id));

      this.emit({
        type: 'task:completed',
        taskId: task.id,
        result: 'Task completed successfully',
      });
    } catch (error: any) {
      const duration = Date.now() - this.startTime;
      const errorMsg = error.message || 'Unknown error';

      if (this.taskId) {
        await db
          .update(tasks)
          .set({
            status: this.cancelled ? 'cancelled' : 'failed',
            error: errorMsg,
            tokensUsed: this.totalTokens,
            durationMs: duration,
            completedAt: new Date(),
          })
          .where(eq(tasks.id, this.taskId));
      }

      this.emit({
        type: 'task:failed',
        taskId: task.id,
        error: errorMsg,
      });
    } finally {
      // Cleanup
      await this.browserTool.close().catch(() => {});
      await this.sandbox.stop().catch(() => {});
    }
  }

  private async agentLoop(initialPrompt: string): Promise<void> {
    const conversationMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: initialPrompt },
    ];

    // Save initial user message
    if (this.taskId) {
      await db.insert(messages).values({
        taskId: this.taskId,
        role: 'user',
        content: initialPrompt,
      });
    }

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      if (this.cancelled) {
        throw new Error('Task cancelled by user');
      }

      // Call Claude API with retry
      const response = await this.callClaudeWithRetry(conversationMessages);

      // Track token usage
      if (response.usage) {
        this.totalTokens += response.usage.input_tokens + response.usage.output_tokens;
      }

      // Add assistant response to conversation
      conversationMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // Check stop reason
      if (response.stop_reason === 'end_turn') {
        // Extract final text message
        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === 'text'
        );
        if (textBlocks.length > 0) {
          const finalMessage = textBlocks.map((b) => b.text).join('\n');
          this.emit({
            type: 'agent:message',
            taskId: this.taskId!,
            content: finalMessage,
          });

          // Save message
          if (this.taskId) {
            await db.insert(messages).values({
              taskId: this.taskId,
              role: 'assistant',
              content: finalMessage,
            });

            await db
              .update(tasks)
              .set({ result: finalMessage })
              .where(eq(tasks.id, this.taskId));
          }
        }
        return;
      }

      // Process tool uses
      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        );

        // Also emit any text blocks as thinking
        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === 'text'
        );
        for (const textBlock of textBlocks) {
          this.emit({
            type: 'agent:thinking',
            taskId: this.taskId!,
            thought: textBlock.text,
          });
        }

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          const stepStart = Date.now();
          const title = this.getStepTitle(toolUse.name, toolUse.input as Record<string, any>);

          // Determine step type
          const stepType = this.getStepType(toolUse.name);

          const stepUpdate: StepUpdate = {
            stepIndex: this.stepIndex,
            type: stepType,
            title,
            status: 'running',
          };

          // Emit step started
          this.emit({ type: 'step:started', taskId: this.taskId!, step: stepUpdate });

          try {
            // Execute the tool
            const result = await this.executeTool(
              toolUse.name,
              toolUse.input as Record<string, any>
            );

            const duration = Date.now() - stepStart;

            // Save step to DB
            if (this.taskId) {
              await db.insert(steps).values({
                taskId: this.taskId,
                stepIndex: this.stepIndex,
                type: stepType,
                status: result.success ? 'completed' : 'failed',
                title,
                input: toolUse.input as Record<string, unknown>,
                output: { result: result.output, error: result.error },
                durationMs: duration,
              });
            }

            // Emit step completed/failed
            const completedStep: StepUpdate = {
              ...stepUpdate,
              status: result.success ? 'completed' : 'failed',
              output: result.output,
              durationMs: duration,
            };

            if (result.success) {
              this.emit({ type: 'step:completed', taskId: this.taskId!, step: completedStep });
            } else {
              this.emit({
                type: 'step:failed',
                taskId: this.taskId!,
                step: completedStep,
                error: result.error || 'Tool execution failed',
              });
            }

            // Build tool result for Claude
            const resultText = result.success
              ? result.output
              : `Error: ${result.error}\n${result.output}`;

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: resultText.substring(0, 50000), // Limit size
            });
          } catch (error: any) {
            const duration = Date.now() - stepStart;

            if (this.taskId) {
              await db.insert(steps).values({
                taskId: this.taskId,
                stepIndex: this.stepIndex,
                type: stepType,
                status: 'failed',
                title,
                input: toolUse.input as Record<string, unknown>,
                output: { error: error.message },
                durationMs: duration,
              });
            }

            this.emit({
              type: 'step:failed',
              taskId: this.taskId!,
              step: { ...stepUpdate, status: 'failed', durationMs: duration },
              error: error.message,
            });

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: ${error.message}`,
              is_error: true,
            });
          }

          this.stepIndex++;
        }

        // Add tool results to conversation
        conversationMessages.push({
          role: 'user',
          content: toolResults,
        });
      }
    }

    throw new Error('Agent exceeded maximum iterations (50). Task may be too complex.');
  }

  private async callClaudeWithRetry(
    conversationMessages: Anthropic.MessageParam[],
    retries = 3
  ): Promise<Anthropic.Message> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.anthropic.messages.create({
          model: process.env.AI_MODEL || 'claude-opus-4-6',
          max_tokens: 16384,
          system: SYSTEM_PROMPT,
          tools: TOOL_DEFINITIONS,
          messages: conversationMessages,
        });
      } catch (error: any) {
        // Provide user-friendly error messages for common API errors
        const status = error.status || error.statusCode;
        const msg = error.message || '';

        // Billing / credit errors — don't retry
        if (status === 400 && (msg.includes('credit balance') || msg.includes('billing'))) {
          throw new Error(
            'Anthropic API credit balance is too low. Please check your API key and billing at console.anthropic.com. ' +
            'Make sure the ANTHROPIC_API_KEY environment variable on your server matches a funded account.'
          );
        }

        // Invalid API key — don't retry
        if (status === 401) {
          throw new Error(
            'Invalid Anthropic API key. Please verify your ANTHROPIC_API_KEY environment variable is correct and active at console.anthropic.com/settings/keys.'
          );
        }

        // Rate limit — retry with backoff
        if (status === 429 && attempt < retries) {
          const delay = Math.pow(2, attempt + 1) * 1000;
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Overloaded — retry with backoff
        if (status === 529 && attempt < retries) {
          const delay = Math.pow(2, attempt + 1) * 2000;
          console.log(`API overloaded. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Model not found
        if (status === 404) {
          throw new Error(
            `AI model "${process.env.AI_MODEL || 'claude-opus-4-6'}" not found. Check the AI_MODEL environment variable.`
          );
        }

        throw error;
      }
    }
    throw new Error('Failed to call Claude API after retries');
  }

  private async executeTool(
    name: string,
    input: Record<string, any>
  ): Promise<ToolResult> {
    switch (name) {
      case 'plan': {
        const plan: TaskPlan = {
          goal: input.goal,
          steps: input.steps,
          estimatedTime: input.estimatedTime,
        };
        if (this.taskId) {
          await db
            .update(tasks)
            .set({ plan, status: 'executing' })
            .where(eq(tasks.id, this.taskId));
        }
        this.emit({ type: 'task:planning', taskId: this.taskId!, plan });
        return {
          success: true,
          output: `Plan created with ${plan.steps.length} steps. Proceeding with execution.`,
        };
      }

      case 'write_file': {
        const result = await this.fsTool.writeFile(input.path, input.content);
        if (result.success) {
          // Detect language from extension
          const ext = input.path.split('.').pop() || '';
          const langMap: Record<string, string> = {
            ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
            py: 'python', rs: 'rust', go: 'go', java: 'java',
            html: 'html', css: 'css', scss: 'scss', json: 'json',
            md: 'markdown', yml: 'yaml', yaml: 'yaml', toml: 'toml',
            sql: 'sql', sh: 'shell', bash: 'shell', dockerfile: 'dockerfile',
          };
          const language = langMap[ext.toLowerCase()] || ext;

          this.emit({
            type: 'file:changed',
            projectId: this.projectId,
            path: input.path,
            content: input.content,
            language,
          });

          // Save file to DB
          if (this.taskId) {
            const existing = await db.query.files.findFirst({
              where: (f, { and, eq: e }) =>
                and(e(f.projectId, this.projectId), e(f.path, input.path)),
            });
            if (existing) {
              await db
                .update(filesTable)
                .set({ content: input.content, language, updatedAt: new Date() })
                .where(eq(filesTable.id, existing.id));
            } else {
              await db.insert(filesTable).values({
                projectId: this.projectId,
                path: input.path,
                content: input.content,
                language,
              });
            }
          }
        }
        return result;
      }

      case 'read_file': {
        return await this.fsTool.readFile(input.path);
      }

      case 'list_files': {
        return await this.fsTool.listFiles(input.path || '/workspace', input.recursive || false);
      }

      case 'run_command': {
        const result = await this.terminalTool.execute(input.command, input.timeout);
        this.emit({
          type: 'terminal:output',
          taskId: this.taskId!,
          output: `$ ${input.command}\n${result.output}`,
        });
        return result;
      }

      case 'search_web': {
        return await this.searchTool.search(input.query);
      }

      case 'browse': {
        const result = await this.browserTool.execute(input as any);
        if (result.metadata?.screenshot) {
          this.emit({
            type: 'browser:screenshot',
            taskId: this.taskId!,
            url: result.metadata.url as string,
            imageBase64: result.metadata.screenshot as string,
          });
        }
        return {
          success: result.success,
          output: result.output,
          error: result.error,
        };
      }

      case 'deploy': {
        const deployResult = await this.deployTool.deploy(input);
        if (deployResult.success && deployResult.metadata?.url) {
          this.emit({
            type: 'deploy:completed',
            projectId: this.projectId,
            url: deployResult.metadata.url as string,
          });
        }
        return deployResult;
      }

      case 'ask_user': {
        this.paused = true;
        this.emit({
          type: 'task:paused',
          taskId: this.taskId!,
          question: input.question,
        });

        // Wait for user response
        const answer = await new Promise<string>((resolve) => {
          this.pauseResolver = resolve;
        });

        this.paused = false;
        return { success: true, output: `User answered: ${answer}` };
      }

      case 'think': {
        this.emit({
          type: 'agent:thinking',
          taskId: this.taskId!,
          thought: input.thought,
        });
        return { success: true, output: 'Thought recorded. Continue with the next action.' };
      }

      default:
        return { success: false, output: '', error: `Unknown tool: ${name}` };
    }
  }

  cancel(): void {
    this.cancelled = true;
    if (this.pauseResolver) {
      this.pauseResolver('Task cancelled by user');
      this.pauseResolver = null;
    }
  }

  resume(answer: string): void {
    if (this.pauseResolver) {
      this.pauseResolver(answer);
      this.pauseResolver = null;
    }
  }

  sendTerminalInput(data: string): void {
    this.terminalTool.sendInput(data);
  }

  private emit(event: ServerEvent): void {
    const room = `project:${this.projectId}`;
    this.io.to(room).emit(event.type, event);
  }

  private getStepType(toolName: string): StepUpdate['type'] {
    const mapping: Record<string, StepUpdate['type']> = {
      plan: 'plan',
      write_file: 'file_write',
      read_file: 'file_read',
      list_files: 'file_read',
      run_command: 'terminal',
      search_web: 'search',
      browse: 'browser',
      deploy: 'deploy',
      ask_user: 'ask_user',
      think: 'think',
    };
    return mapping[toolName] || 'think';
  }

  private getStepTitle(toolName: string, input: Record<string, any>): string {
    switch (toolName) {
      case 'plan':
        return `Planning: ${input.goal?.substring(0, 60) || 'Creating plan'}`;
      case 'write_file':
        return `Writing ${input.path}`;
      case 'read_file':
        return `Reading ${input.path}`;
      case 'list_files':
        return `Listing files in ${input.path || '/workspace'}`;
      case 'run_command':
        return `Running: ${input.command?.substring(0, 60) || 'command'}`;
      case 'search_web':
        return `Searching: ${input.query?.substring(0, 60) || 'web'}`;
      case 'browse':
        return `Browser: ${input.action}${input.url ? ` ${input.url.substring(0, 40)}` : ''}`;
      case 'deploy':
        return 'Deploying application';
      case 'ask_user':
        return 'Asking user a question';
      case 'think':
        return 'Thinking...';
      default:
        return toolName;
    }
  }
}
