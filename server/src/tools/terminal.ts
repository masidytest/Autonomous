import { SupabaseSandbox } from '../agents/supabase-sandbox.js';
import type { ToolResult } from '../../../shared/types.js';

export class TerminalTool {
  private sandbox: SupabaseSandbox;

  constructor(sandbox: SupabaseSandbox) {
    this.sandbox = sandbox;
  }

  async execute(command: string, timeout?: number): Promise<ToolResult> {
    try {
      const result = await this.sandbox.exec(
        `cd /workspace && ${command}`,
        timeout || 120000
      );

      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');

      return {
        success: result.exitCode === 0,
        output: output || '(no output)',
        error: result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : undefined,
        metadata: { exitCode: result.exitCode },
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  async sendInput(data: string): Promise<void> {
    // Placeholder for interactive terminal support
    console.log('Terminal input:', data);
  }
}
