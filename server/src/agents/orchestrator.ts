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

const MAX_ITERATIONS = 20;

/**
 * Build a dynamic system prompt that embeds the user's request directly
 * so the AI cannot drift from it.
 */
function buildSystemPrompt(userRequest: string): string {
  return `You are Masidy Agent. You build exactly what users ask for.

=== YOUR ASSIGNMENT ===
The user wants: "${userRequest}"
You MUST build exactly this. Not something else. Not a variation. EXACTLY this.
========================

## ABSOLUTE RULES

1. BUILD WHAT WAS ASKED — The project name, type, theme, and content must match "${userRequest}" exactly. If the user asked for a "crypto currency platform", every file you create must be about crypto currency. Do not build a search tool, a portfolio, a dashboard, or anything else.

2. WRITE EACH FILE ONLY ONCE — Plan everything in your head first. Then write each file once with complete, final content. You get ONE chance per file. If you try to write the same file twice, it will be rejected.

3. MAXIMUM 3 FILES — You create exactly these files:
   - /workspace/index.html (the complete HTML page with ALL content, structure, and inline styles or Tailwind classes)
   - /workspace/css/styles.css (additional CSS if needed)
   - /workspace/js/app.js (JavaScript for interactivity)
   That's it. No other files. No subdirectories.

4. EXACT WORKFLOW — Do these steps in order, nothing else:
   Step 1: Call the "plan" tool with 3 steps (write index.html, write styles.css, write app.js)
   Step 2: Call write_file for /workspace/index.html with the COMPLETE page
   Step 3: Call write_file for /workspace/css/styles.css
   Step 4: Call write_file for /workspace/js/app.js
   Step 5: Send a brief summary message. STOP.

5. FORBIDDEN ACTIONS:
   - Do NOT call list_files or read_file (there are no existing files to read)
   - Do NOT call browse (the preview panel shows your HTML automatically)
   - Do NOT call run_command (no terminal needed for static sites)
   - Do NOT call search_web (you already know how to build this)
   - Do NOT rewrite any file — one write per file, period
   - Do NOT start dev servers
   - Do NOT create more than 3 files

## HOW TO BUILD

Use static HTML with CDN libraries. Available CDNs:
- Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- Chart.js: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
- Lucide Icons: <script src="https://unpkg.com/lucide@latest"></script>
- Font Awesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
- Google Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
- GSAP: <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
- Alpine.js: <script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>

## QUALITY
- Modern, premium UI — the page should look professional and polished
- Use Tailwind CSS for styling — use real, specific content related to "${userRequest}"
- Responsive design, smooth animations, proper spacing
- Real placeholder data that matches the theme (e.g., crypto prices for crypto, recipes for food apps, etc.)
- The <title> must match what the user asked for

## PERSONALITY
- Brief and friendly. Don't over-explain.
- After writing all files, give a 2-3 sentence summary and suggest 2 improvements.`;
}

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'plan',
    description: 'Create an execution plan. Call this FIRST. Plan must have exactly 3 steps: write index.html, write styles.css, write app.js.',
    input_schema: {
      type: 'object' as const,
      properties: {
        goal: { type: 'string', description: 'Must match the user request exactly' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string', enum: ['file_write'] },
              description: { type: 'string' },
            },
            required: ['title', 'type', 'description'],
          },
        },
      },
      required: ['goal', 'steps'],
    },
  },
  {
    name: 'write_file',
    description: 'Write a file. Each file can only be written ONCE. Write COMPLETE content — you will not get another chance.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path: /workspace/index.html, /workspace/css/styles.css, or /workspace/js/app.js' },
        content: { type: 'string', description: 'Complete file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read a file. Only use if explicitly asked to modify an existing project.',
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
    description: 'List files. Only use if explicitly asked to modify an existing project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Directory path', default: '/workspace' },
        recursive: { type: 'boolean', default: false },
      },
      required: [],
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command. Only for backend projects. Never use for frontend/static sites.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'Shell command' },
        timeout: { type: 'number', description: 'Timeout in ms' },
      },
      required: ['command'],
    },
  },
  {
    name: 'deploy',
    description: 'Deploy the application to Vercel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        buildCommand: { type: 'string' },
        startCommand: { type: 'string' },
        port: { type: 'number' },
      },
      required: [],
    },
  },
  {
    name: 'ask_user',
    description: 'Ask the user a question when you need clarification.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string', description: 'Question to ask' },
      },
      required: ['question'],
    },
  },
];

/* ── Orchestrator ── */

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
  private activeSkills: { name: string; content: string }[] = [];
  private writtenFiles: Set<string> = new Set();
  private userPrompt: string = '';

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

  setSkills(skills: { name: string; content: string }[]) {
    this.activeSkills = skills;
  }

  private getSystemPrompt(): string {
    let prompt = buildSystemPrompt(this.userPrompt);

    if (this.activeSkills.length > 0) {
      const skillsSection = this.activeSkills
        .map((s) => `### ${s.name}\n${s.content}`)
        .join('\n\n');
      prompt += `\n\n## Active Skills\n${skillsSection}`;
    }

    return prompt;
  }

  async execute(prompt: string): Promise<void> {
    this.startTime = Date.now();
    this.userPrompt = prompt;

    const [task] = await db
      .insert(tasks)
      .values({
        projectId: this.projectId,
        prompt,
        status: 'planning',
      })
      .returning();

    this.taskId = task.id;
    this.emit({ type: 'task:started', taskId: task.id, projectId: this.projectId });

    try {
      const containerId = await this.sandbox.start();
      await db
        .update(projects)
        .set({ containerId })
        .where(eq(projects.id, this.projectId));

      // NO template scaffolding — let the AI build from scratch with the user's exact request
      await this.agentLoop(prompt);

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
      await this.browserTool.close().catch(() => {});
      await this.sandbox.stop().catch(() => {});
    }
  }

  private async agentLoop(initialPrompt: string): Promise<void> {
    const conversationMessages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Build this: ${initialPrompt}\n\nRemember: plan first (3 steps), then write exactly 3 files (index.html, styles.css, app.js), then summarize. Each file written ONCE with complete content. Every file must be about "${initialPrompt}" — not about anything else.`,
      },
    ];

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

      const response = await this.callClaudeWithRetry(conversationMessages);

      if (response.usage) {
        this.totalTokens += response.usage.input_tokens + response.usage.output_tokens;
      }

      conversationMessages.push({
        role: 'assistant',
        content: response.content,
      });

      if (response.stop_reason === 'end_turn') {
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

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        );

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
          const stepType = this.getStepType(toolUse.name);

          const stepUpdate: StepUpdate = {
            stepIndex: this.stepIndex,
            type: stepType,
            title,
            status: 'running',
          };

          this.emit({ type: 'step:started', taskId: this.taskId!, step: stepUpdate });

          try {
            const result = await this.executeTool(
              toolUse.name,
              toolUse.input as Record<string, any>
            );

            const duration = Date.now() - stepStart;

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

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: (result.success ? result.output : `Error: ${result.error}\n${result.output}`).substring(0, 50000),
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

        conversationMessages.push({
          role: 'user',
          content: toolResults,
        });
      }
    }

    throw new Error('Agent exceeded maximum iterations.');
  }

  private async callClaudeWithRetry(
    conversationMessages: Anthropic.MessageParam[],
    retries = 3
  ): Promise<Anthropic.Message> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.anthropic.messages.create({
          model: process.env.AI_MODEL || 'claude-sonnet-4-5-20250929',
          max_tokens: 16384,
          system: this.getSystemPrompt(),
          tools: TOOL_DEFINITIONS,
          messages: conversationMessages,
        });
      } catch (error: any) {
        const status = error.status || error.statusCode;
        const msg = error.message || '';

        if (status === 400 && (msg.includes('credit balance') || msg.includes('billing'))) {
          throw new Error('Anthropic API credit balance too low. Check billing at console.anthropic.com.');
        }
        if (status === 401) {
          throw new Error('Invalid Anthropic API key.');
        }
        if (status === 429 && attempt < retries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
          continue;
        }
        if (status === 529 && attempt < retries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 2000));
          continue;
        }
        if (status === 404) {
          throw new Error(`AI model not found. Check AI_MODEL env var.`);
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
          output: `Plan created. Now write the 3 files in order: index.html, styles.css, app.js. Each file ONCE with COMPLETE content about "${this.userPrompt}".`,
        };
      }

      case 'write_file': {
        const filePath = input.path as string;

        // HARD BLOCK: reject rewrites
        if (this.writtenFiles.has(filePath)) {
          return {
            success: false,
            output: '',
            error: `BLOCKED: "${filePath}" was already written. You cannot rewrite files. Move to the next file or finish with a summary.`,
          };
        }

        this.writtenFiles.add(filePath);

        const result = await this.fsTool.writeFile(filePath, input.content);
        if (result.success) {
          const ext = filePath.split('.').pop() || '';
          const langMap: Record<string, string> = {
            ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
            py: 'python', html: 'html', css: 'css', json: 'json',
            md: 'markdown', yml: 'yaml', yaml: 'yaml',
          };
          const language = langMap[ext.toLowerCase()] || ext;

          this.emit({
            type: 'file:changed',
            projectId: this.projectId,
            path: filePath,
            content: input.content,
            language,
          });

          if (this.taskId) {
            const existing = await db.query.files.findFirst({
              where: (f, { and, eq: e }) =>
                and(e(f.projectId, this.projectId), e(f.path, filePath)),
            });
            if (existing) {
              await db
                .update(filesTable)
                .set({ content: input.content, language, updatedAt: new Date() })
                .where(eq(filesTable.id, existing.id));
            } else {
              await db.insert(filesTable).values({
                projectId: this.projectId,
                path: filePath,
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
        const url = (input.url || '').toLowerCase();
        if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('file://')) {
          return {
            success: false,
            output: '',
            error: 'Cannot browse localhost/file URLs. The preview shows your HTML automatically.',
          };
        }

        const result = await this.browserTool.execute(input as any);
        if (result.metadata?.screenshot) {
          this.emit({
            type: 'browser:screenshot',
            taskId: this.taskId!,
            url: result.metadata.url as string,
            imageBase64: result.metadata.screenshot as string,
          });
        }
        return { success: result.success, output: result.output, error: result.error };
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
        const answer = await new Promise<string>((resolve) => {
          this.pauseResolver = resolve;
        });
        this.paused = false;
        return { success: true, output: `User answered: ${answer}` };
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
        return `Listing files`;
      case 'run_command':
        return `Running: ${input.command?.substring(0, 60) || 'command'}`;
      case 'search_web':
        return `Searching: ${input.query?.substring(0, 60) || 'web'}`;
      case 'browse':
        return `Browsing: ${input.url?.substring(0, 40) || ''}`;
      case 'deploy':
        return 'Deploying application';
      case 'ask_user':
        return 'Asking user';
      default:
        return toolName;
    }
  }
}
