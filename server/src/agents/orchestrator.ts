import Anthropic from '@anthropic-ai/sdk';
import type { Server as SocketServer } from 'socket.io';
import { eq, desc } from 'drizzle-orm';
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
 * Build a system prompt for a NEW project build.
 */
function buildNewProjectPrompt(userRequest: string): string {
  return `You are Masidy Agent. You build exactly what users ask for.

=== YOUR ASSIGNMENT ===
The user wants: "${userRequest}"
Build EXACTLY this. Not something else. EXACTLY this.
========================

## RULES

1. BUILD WHAT WAS ASKED — Everything you create must be about "${userRequest}". The title, content, colors, and data must all relate to this topic.

2. WRITE EACH FILE ONLY ONCE — Plan first, then write complete files. If you try to write the same file again, it will be rejected.

3. CREATE 3 FILES in this order:
   - /workspace/index.html (complete HTML with all content)
   - /workspace/css/styles.css (CSS styles)
   - /workspace/js/app.js (JavaScript)

4. WORKFLOW: plan → write index.html → write styles.css → write app.js → summary. That's it.

5. FORBIDDEN: No browsing, no dev servers, no terminal commands, no searching, no reading files. Just plan and write.

## CDN LIBRARIES
- Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- Chart.js: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
- Lucide Icons: <script src="https://unpkg.com/lucide@latest"></script>
- Font Awesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
- Google Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
- GSAP: <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
- Alpine.js: <script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>

## QUALITY
- Premium, modern UI with Tailwind CSS
- Real content related to "${userRequest}" (not lorem ipsum)
- Responsive, animated, professional
- The <title> must describe "${userRequest}"`;
}

/**
 * Build a system prompt for a FOLLOW-UP modification on an existing project.
 */
function buildFollowUpPrompt(originalDescription: string, existingFiles: { path: string; content: string }[], userRequest: string): string {
  // Build a summary of existing files (just paths + first 200 chars to save tokens)
  const fileSummary = existingFiles.map(f => {
    const preview = f.content.substring(0, 300).replace(/\n/g, ' ');
    return `- ${f.path}: ${preview}...`;
  }).join('\n');

  return `You are Masidy Agent. You MODIFY existing projects based on user feedback.

=== CONTEXT ===
Original project: "${originalDescription}"
The user already has a working project with these files:
${fileSummary}

=== USER'S REQUEST ===
The user says: "${userRequest}"
Apply this change to the existing project. Keep everything else the same.
========================

## RULES

1. MODIFY, DON'T REBUILD — The project already exists. Only change what the user asked for.

2. READ FIRST, THEN WRITE — Use read_file to see the current content, then write_file with the updated version.

3. KEEP THE SAME PROJECT — Do NOT change the project type, theme, or purpose. Only apply the specific change requested.

4. MINIMAL CHANGES — Only modify the files that need changing. If the user says "change the name", only update the title/heading text, don't rewrite the entire page.

## WORKFLOW
1. Read the file(s) that need changing
2. Write the updated version(s)
3. Brief summary of what changed

## FORBIDDEN: No browsing, no dev servers, no terminal commands, no searching. Just read and write files.`;
}

const NEW_PROJECT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'plan',
    description: 'Create an execution plan. Call this FIRST for new builds.',
    input_schema: {
      type: 'object' as const,
      properties: {
        goal: { type: 'string', description: 'Must match the user request' },
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
    description: 'Write a file ONCE with COMPLETE content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'Complete file content' },
      },
      required: ['path', 'content'],
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
    description: 'Ask the user a clarification question.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string' },
      },
      required: ['question'],
    },
  },
];

const FOLLOW_UP_TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Read a file to see its current content before modifying it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write updated content to a file.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'Updated file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in the project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', default: '/workspace' },
      },
      required: [],
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
    description: 'Ask the user a clarification question.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string' },
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
  private isFollowUp: boolean = false;

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

  private getSystemPrompt(existingFiles: { path: string; content: string }[], projectDescription: string): string {
    let prompt: string;

    if (this.isFollowUp) {
      prompt = buildFollowUpPrompt(projectDescription, existingFiles, this.userPrompt);
    } else {
      prompt = buildNewProjectPrompt(this.userPrompt);
    }

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

    // Check if this project already has files (= follow-up modification)
    const rawFiles = await db.query.files.findMany({
      where: eq(filesTable.projectId, this.projectId),
    });
    const existingFiles = rawFiles
      .filter(f => f.content != null)
      .map(f => ({ path: f.path, content: f.content as string }));
    this.isFollowUp = existingFiles.length > 0;

    // Get project description for context
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, this.projectId),
    });
    const projectDescription = project?.description || project?.name || prompt;

    console.log(`[Orchestrator] ${this.isFollowUp ? 'FOLLOW-UP' : 'NEW BUILD'} for project ${this.projectId}: "${prompt.substring(0, 80)}"`);

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

      // For follow-ups, restore existing files into the sandbox
      if (this.isFollowUp && existingFiles.length > 0) {
        for (const f of existingFiles) {
          if (f.content) {
            await this.sandbox.writeFile(f.path, f.content);
          }
        }
        console.log(`[Orchestrator] Restored ${existingFiles.length} existing files to sandbox`);
      }

      await this.agentLoop(prompt, existingFiles, projectDescription);

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

  private async agentLoop(
    initialPrompt: string,
    existingFiles: { path: string; content: string }[],
    projectDescription: string
  ): Promise<void> {
    let userMessage: string;

    if (this.isFollowUp) {
      const fileList = existingFiles.map(f => f.path).join(', ');
      userMessage = `The user says: "${initialPrompt}"\n\nExisting files: ${fileList}\n\nApply this change. Read the relevant file(s) first, then write the updated version. Keep everything else the same.`;
    } else {
      userMessage = `Build this: ${initialPrompt}\n\nCreate a plan first, then write 3 files (index.html, css/styles.css, js/app.js) with complete content about "${initialPrompt}". Each file written ONCE.`;
    }

    const conversationMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage },
    ];

    if (this.taskId) {
      await db.insert(messages).values({
        taskId: this.taskId,
        role: 'user',
        content: initialPrompt,
      });
    }

    const tools = this.isFollowUp ? FOLLOW_UP_TOOLS : NEW_PROJECT_TOOLS;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      if (this.cancelled) {
        throw new Error('Task cancelled by user');
      }

      const response = await this.callClaudeWithRetry(conversationMessages, existingFiles, projectDescription, tools);

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
    existingFiles: { path: string; content: string }[],
    projectDescription: string,
    tools: Anthropic.Tool[],
    retries = 3
  ): Promise<Anthropic.Message> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.anthropic.messages.create({
          model: process.env.AI_MODEL || 'claude-sonnet-4-5-20250929',
          max_tokens: 16384,
          system: this.getSystemPrompt(existingFiles, projectDescription),
          tools,
          messages: conversationMessages,
        });
      } catch (error: any) {
        const status = error.status || error.statusCode;
        const msg = error.message || '';

        if (status === 400 && (msg.includes('credit balance') || msg.includes('billing'))) {
          throw new Error('Anthropic API credit balance too low.');
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
          output: `Plan created with ${plan.steps.length} steps. Now write the files. Each file ONCE, complete content about "${this.userPrompt}".`,
        };
      }

      case 'write_file': {
        const filePath = input.path as string;

        // For new builds, block rewrites. For follow-ups, allow them.
        if (!this.isFollowUp && this.writtenFiles.has(filePath)) {
          return {
            success: false,
            output: '',
            error: `BLOCKED: "${filePath}" already written. Move to the next file or summarize.`,
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
            error: 'Cannot browse localhost/file URLs.',
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
        return 'Listing files';
      case 'run_command':
        return `Running: ${input.command?.substring(0, 60) || 'command'}`;
      case 'deploy':
        return 'Deploying application';
      case 'ask_user':
        return 'Asking user';
      default:
        return toolName;
    }
  }
}
