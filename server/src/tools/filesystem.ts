import { SandboxManager } from '../agents/sandbox.js';
import type { ToolResult } from '@shared/types.js';

export class FileSystemTool {
  private sandbox: SandboxManager;

  constructor(sandbox: SandboxManager) {
    this.sandbox = sandbox;
  }

  async writeFile(path: string, content: string): Promise<ToolResult> {
    try {
      const fullPath = path.startsWith('/') ? path : `/workspace/${path}`;
      return await this.sandbox.writeFile(fullPath, content);
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async readFile(path: string): Promise<ToolResult> {
    try {
      const fullPath = path.startsWith('/') ? path : `/workspace/${path}`;
      return await this.sandbox.readFile(fullPath);
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async listFiles(path: string = '/workspace', recursive: boolean = false): Promise<ToolResult> {
    try {
      const fullPath = path.startsWith('/') ? path : `/workspace/${path}`;
      return await this.sandbox.listFiles(fullPath, recursive);
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }
}
