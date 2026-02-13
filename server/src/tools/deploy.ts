import { SupabaseSandbox } from '../agents/supabase-sandbox.js';
import { db } from '../services/database.js';
import { files, projects, deployments } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { ToolResult } from '../../../shared/types.js';

interface DeployInput {
  buildCommand?: string;
  startCommand?: string;
  port?: number;
}

export class DeployTool {
  private sandbox: SupabaseSandbox;
  private projectSlug: string;
  private projectId?: string;

  constructor(sandbox: SupabaseSandbox, projectSlug: string, projectId?: string) {
    this.sandbox = sandbox;
    this.projectSlug = projectSlug;
    this.projectId = projectId;
  }

  async deploy(input: DeployInput): Promise<ToolResult> {
    try {
      const steps: string[] = [];

      // Step 1: Build if needed
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

      // Step 2: Deploy to Vercel
      const VERCEL_TOKEN = process.env.VERCEL_DEPLOYMENT_TOKEN || process.env.VERCEL_TOKEN;

      if (!VERCEL_TOKEN || !this.projectId) {
        // Fallback: just report the local preview URL
        const port = input.port || 3000;
        steps.push(`No Vercel token configured — project available locally on port ${port}`);
        return {
          success: true,
          output: steps.join('\n'),
          metadata: { port, slug: this.projectSlug },
        };
      }

      steps.push('Deploying to Vercel...');

      // Get project files from DB
      const projectFiles = await db.query.files.findMany({
        where: eq(files.projectId, this.projectId),
      });

      if (!projectFiles.length) {
        return { success: false, output: steps.join('\n'), error: 'No files found to deploy' };
      }

      const vercelFiles = projectFiles
        .filter(f => !f.isDirectory && f.content)
        .map(f => ({
          file: f.path.replace(/^\/workspace\//, '').replace(/^\//, ''),
          data: f.content || '',
        }));

      const response = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.projectSlug,
          files: vercelFiles,
          projectSettings: { framework: null },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          output: steps.join('\n'),
          error: `Vercel deployment failed: ${(errData as any).error?.message || response.statusText}`,
        };
      }

      const deployData = await response.json() as any;
      const deployUrl = `https://${deployData.url}`;

      // Save deployment to DB
      await db.insert(deployments).values({
        projectId: this.projectId,
        url: deployUrl,
        status: 'live',
      });

      await db
        .update(projects)
        .set({ deployUrl })
        .where(eq(projects.id, this.projectId));

      steps.push(`Deployed successfully!`);
      steps.push(`URL: ${deployUrl}`);

      return {
        success: true,
        output: steps.join('\n'),
        metadata: {
          url: deployUrl,
          slug: this.projectSlug,
        },
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }
}
