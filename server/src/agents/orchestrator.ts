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

const MAX_ITERATIONS = 25;

const SYSTEM_PROMPT = `You are Masidy Agent — an autonomous AI software engineer. You build web applications from a single prompt.

## CRITICAL RULES — FOLLOW EXACTLY

### 1. STAY FOCUSED — ZERO DRIFTING
- Build EXACTLY what the user asked for. If they say "crypto platform", you build a crypto platform — not a portfolio, not a todo app, not something else.
- The project name, theme, colors, and category MUST match the user's request for the ENTIRE build.
- Once you create a plan, EXECUTE it step by step without changing direction.
- NEVER rename the project, switch themes, or change categories mid-build.
- NEVER start over. NEVER rewrite files you already created from scratch.

### 2. WRITE EACH FILE ONCE — COMPLETE AND FINAL
- Think and plan BEFORE writing any file. Know exactly what goes in each file.
- Write index.html ONCE with all the HTML structure, styling, and content.
- Write each CSS/JS file ONCE with complete, final content.
- If you must update a file later, make SMALL targeted changes — never rewrite from scratch.
- Target 3-6 files total per project. No more.

### 3. NO WASTED ACTIONS
- NO browsing (the user sees your HTML live in the preview panel automatically).
- NO dev servers (no python http.server, npm run dev, npx serve).
- NO browsing localhost, 127.0.0.1, or file:// URLs.
- NO terminal commands unless truly necessary (backend projects only).
- NO reading files you just wrote — you already know the content.

### 4. STATIC HTML + CDN ONLY
Build as static HTML + CSS + JS using CDN libraries:
- Files go directly in /workspace (e.g., /workspace/index.html). NO subdirectories like /workspace/my-project/.
- index.html is ALWAYS the first file — it's what the preview displays.

CDN libraries:
- Tailwind: \`<script src="https://cdn.tailwindcss.com"></script>\`
- React: \`<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>\` + ReactDOM + Babel
- Vue: \`<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>\`
- Chart.js: \`<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\`
- Three.js: \`<script src="https://unpkg.com/three@0.160/build/three.min.js"></script>\`
- GSAP: \`<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>\`
- Lucide: \`<script src="https://unpkg.com/lucide@latest"></script>\`
- Font Awesome: \`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\`
- Google Fonts: \`<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\`
- Alpine.js: \`<script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>\`

### 5. EXACT WORKFLOW — NO DEVIATIONS
1. **PLAN** — Create a plan with 3-6 steps that matches the user's request EXACTLY.
2. **WRITE FILES** — Create index.html first (complete), then CSS, then JS. Each file written ONCE.
3. **DONE** — Brief summary of what you built + 2-3 improvement ideas. Stop.

Do NOT add extra steps. Do NOT go back and rewrite. Do NOT browse. Just plan, write, summarize.

## Quality
- Modern, premium UI with clean typography and good spacing
- Responsive and mobile-friendly
- Consistent color scheme matching the project theme
- Proper meta tags and viewport`;

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'plan',
    description: 'Create an execution plan. MUST be called first. The plan must match the user request EXACTLY — same project type, name, and theme throughout.',
    input_schema: {
      type: 'object' as const,
      properties: {
        goal: { type: 'string', description: 'The overall goal — must match the user request exactly' },
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
    description: 'Write COMPLETE content to a file. Write each file ONCE with ALL its content. Do NOT rewrite files you already created. Create index.html first.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path (relative to /workspace or absolute)' },
        content: { type: 'string', description: 'COMPLETE file content — write everything in one go' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read a file. Only use this to read files you need to UPDATE — never read files you just wrote.',
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
    description: 'Run a shell command. ONLY use for backend projects that truly need npm install. For frontend web apps, use CDN libraries and write_file instead. NEVER start dev servers.',
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
    description: 'Search the web for information. Use sparingly — only when you need specific technical info.',
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
    description: 'Browse an EXTERNAL public website for research ONLY. NEVER use for previewing your own work. NEVER navigate to localhost, 127.0.0.1, or file:// URLs. The preview panel shows your HTML automatically.',
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
    description: 'Deploy the application to Vercel.',
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
    description: 'Ask the user a question when you need clarification.',
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
    description: 'Think about your approach BEFORE writing code. Use this to plan file structure and content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        thought: { type: 'string', description: 'Your reasoning and analysis' },
      },
      required: ['thought'],
    },
  },
];

/* ── Project Templates ── */

interface ProjectTemplate {
  files: { path: string; content: string }[];
}

function detectProjectType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('react') && !p.includes('vue') && !p.includes('svelte')) return 'react';
  if (p.includes('vue')) return 'vue';
  if (p.includes('three.js') || p.includes('3d') || p.includes('threejs')) return 'threejs';
  if (p.includes('game')) return 'game';
  if (p.includes('dashboard') || p.includes('admin')) return 'dashboard';
  if (p.includes('api') || p.includes('backend') || p.includes('server') || p.includes('express') || p.includes('flask')) return 'backend';
  return 'static';
}

function getTemplate(type: string): ProjectTemplate {
  switch (type) {
    case 'react':
      return {
        files: [
          {
            path: '/workspace/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="js/app.jsx"></script>
</body>
</html>`,
          },
        ],
      };

    case 'dashboard':
      return {
        files: [
          {
            path: '/workspace/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50">
  <div id="app"></div>
  <script src="js/app.js"></script>
</body>
</html>`,
          },
        ],
      };

    case 'threejs':
      return {
        files: [
          {
            path: '/workspace/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Experience</title>
  <script src="https://unpkg.com/three@0.160/build/three.min.js"></script>
  <style>body { margin: 0; overflow: hidden; } canvas { display: block; }</style>
</head>
<body>
  <script src="js/app.js"></script>
</body>
</html>`,
          },
        ],
      };

    case 'game':
      return {
        files: [
          {
            path: '/workspace/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
    canvas { border-radius: 8px; box-shadow: 0 0 40px rgba(99,102,241,0.2); }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script src="js/game.js"></script>
</body>
</html>`,
          },
        ],
      };

    case 'vue':
      return {
        files: [
          {
            path: '/workspace/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body>
  <div id="app"></div>
  <script src="js/app.js"></script>
</body>
</html>`,
          },
        ],
      };

    case 'backend':
      return { files: [] };

    default: // static
      return {
        files: [
          {
            path: '/workspace/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-white text-slate-900">
  <div id="app"></div>
  <link rel="stylesheet" href="css/styles.css">
  <script src="js/app.js"></script>
</body>
</html>`,
          },
          {
            path: '/workspace/css/styles.css',
            content: `/* Custom styles */\n`,
          },
          {
            path: '/workspace/js/app.js',
            content: `// App logic\ndocument.addEventListener('DOMContentLoaded', () => {\n  if (window.lucide) lucide.createIcons();\n});\n`,
          },
        ],
      };
  }
}

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
  private writtenFiles: Set<string> = new Set(); // Track files already written

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

  /** Inject active skills from the client */
  setSkills(skills: { name: string; content: string }[]) {
    this.activeSkills = skills;
  }

  /** Build the full system prompt with active skills injected */
  private buildSystemPrompt(): string {
    if (this.activeSkills.length === 0) return SYSTEM_PROMPT;

    const skillsSection = this.activeSkills
      .map((s) => `### ${s.name}\n${s.content}`)
      .join('\n\n');

    return `${SYSTEM_PROMPT}\n\n## Active Skills (${this.activeSkills.length} enabled)\n${skillsSection}`;
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

      // Scaffold template files based on the prompt
      await this.scaffoldTemplate(prompt);

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

  /** Scaffold template files into the sandbox and DB based on prompt analysis */
  private async scaffoldTemplate(prompt: string): Promise<void> {
    const projectType = detectProjectType(prompt);
    const template = getTemplate(projectType);

    if (template.files.length === 0) return;

    console.log(`[Orchestrator] Scaffolding ${projectType} template (${template.files.length} files)`);

    for (const file of template.files) {
      // Write to sandbox
      await this.sandbox.writeFile(file.path, file.content);

      // Detect language
      const ext = file.path.split('.').pop() || '';
      const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        py: 'python', html: 'html', css: 'css', json: 'json',
        md: 'markdown', yml: 'yaml', yaml: 'yaml',
      };
      const language = langMap[ext.toLowerCase()] || ext;

      // Save to DB
      const existing = await db.query.files.findFirst({
        where: (f, { and, eq: e }) =>
          and(e(f.projectId, this.projectId), e(f.path, file.path)),
      });
      if (!existing) {
        await db.insert(filesTable).values({
          projectId: this.projectId,
          path: file.path,
          content: file.content,
          language,
        });
      }

      // Emit to client so preview updates immediately
      this.emit({
        type: 'file:changed',
        projectId: this.projectId,
        path: file.path,
        content: file.content,
        language,
      });

      // Track that this file was scaffolded
      this.writtenFiles.add(file.path);
    }
  }

  private async agentLoop(initialPrompt: string): Promise<void> {
    // Inject the user's request as a focused context message
    const focusedPrompt = `BUILD THIS: "${initialPrompt}"

RULES FOR THIS BUILD:
- Stay focused on EXACTLY this request. Do not change the project type, name, or theme.
- Write each file ONCE with COMPLETE content. Do not rewrite files.
- Follow your plan step by step. Do not deviate or add extra steps.
- When done, summarize briefly and stop.`;

    const conversationMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: focusedPrompt },
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
            let resultText = result.success
              ? result.output
              : `Error: ${result.error}\n${result.output}`;

            // If a file was rewritten, warn Claude
            if (toolUse.name === 'write_file') {
              const filePath = (toolUse.input as any).path;
              if (this.writtenFiles.has(filePath)) {
                resultText += `\n\n⚠️ WARNING: You rewrote "${filePath}" which was already written. Do NOT rewrite files again. Continue with your next step.`;
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: resultText.substring(0, 50000),
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

    throw new Error('Agent exceeded maximum iterations (25). Task may be too complex.');
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
          system: this.buildSystemPrompt(),
          tools: TOOL_DEFINITIONS,
          messages: conversationMessages,
        });
      } catch (error: any) {
        const status = error.status || error.statusCode;
        const msg = error.message || '';

        // Billing / credit errors — don't retry
        if (status === 400 && (msg.includes('credit balance') || msg.includes('billing'))) {
          throw new Error(
            'Anthropic API credit balance is too low. Please check your API key and billing at console.anthropic.com.'
          );
        }

        // Invalid API key — don't retry
        if (status === 401) {
          throw new Error(
            'Invalid Anthropic API key. Please verify your ANTHROPIC_API_KEY environment variable.'
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
            `AI model "${process.env.AI_MODEL || 'claude-sonnet-4-5-20250929'}" not found. Check the AI_MODEL environment variable.`
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
          output: `Plan created with ${plan.steps.length} steps. Now execute each step IN ORDER. Write each file ONCE with complete content. Do NOT deviate from this plan.`,
        };
      }

      case 'write_file': {
        const filePath = input.path as string;

        // Track file writes
        const isRewrite = this.writtenFiles.has(filePath);
        this.writtenFiles.add(filePath);

        if (isRewrite) {
          console.log(`[Orchestrator] WARNING: File "${filePath}" being rewritten (was already written)`);
        }

        const result = await this.fsTool.writeFile(filePath, input.content);
        if (result.success) {
          // Detect language from extension
          const ext = filePath.split('.').pop() || '';
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
            path: filePath,
            content: input.content,
            language,
          });

          // Save file to DB
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
        // Block localhost/file browsing
        const url = (input.url || '').toLowerCase();
        if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('file://')) {
          return {
            success: false,
            output: '',
            error: 'Cannot browse localhost or file:// URLs. The preview panel shows your HTML automatically. Continue with your next step.',
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
        return { success: true, output: 'Continue with the next step in your plan.' };
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
