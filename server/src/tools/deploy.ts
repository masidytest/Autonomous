import { SupabaseSandbox } from '../agents/supabase-sandbox.js';
import type { ToolResult } from '../../../shared/types.js';

interface DeployInput {
  buildCommand?: string;
  startCommand?: string;
  port?: number;
}

export class DeployTool {
  private sandbox: SupabaseSandbox;
  private projectSlug: string;

  constructor(sandbox: SupabaseSandbox, projectSlug: string) {
    this.sandbox = sandbox;
    this.projectSlug = projectSlug;
  }

  async deploy(input: DeployInput): Promise<ToolResult> {
    try {
      const steps: string[] = [];

      // Step 1: Build
      if (input.buildCommand) {
        steps.push(`Running build: ${input.buildCommand}`);
        const buildResult = await this.sandbox.exec(
          `cd /workspace && ${input.buildCommand}`,
          120000
        );
        if (buildResult.exitCode !== 0) {
          return {
            success: false,
            output: steps.join('\n'),
            error: `Build failed:\n${buildResult.stderr || buildResult.stdout}`,
          };
        }
        steps.push('Build succeeded');
      }

      // Step 2: Start the application
      if (input.startCommand) {
        steps.push(`Starting app: ${input.startCommand}`);
        // Start in background (SupabaseSandbox handles Windows/Unix translation)
        const bgCmd = process.platform === 'win32'
          ? `start /B ${input.startCommand}`
          : `nohup ${input.startCommand} > /tmp/app.log 2>&1 &`;
        await this.sandbox.exec(bgCmd, 10000);
        // Wait for app to start
        await new Promise((resolve) => setTimeout(resolve, 3000));
        steps.push('Application started');
      }

      // Step 3: Generate deploy URL
      const port = input.port || 3000;
      const deployUrl = `https://${this.projectSlug}.masidy.app`;

      steps.push(`Deploy URL: ${deployUrl}`);
      steps.push(`Internal port: ${port}`);
      steps.push('');
      steps.push('Note: In production, this would:');
      steps.push('1. Snapshot the container');
      steps.push('2. Push to container registry');
      steps.push('3. Deploy to hosting infrastructure');
      steps.push(`4. Route ${deployUrl} to the container`);

      return {
        success: true,
        output: steps.join('\n'),
        metadata: {
          url: deployUrl,
          port,
          slug: this.projectSlug,
        },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }
}
