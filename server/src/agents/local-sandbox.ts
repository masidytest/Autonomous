import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ToolResult } from '../../../shared/types.js';

const execAsync = promisify(execCb);
const IS_WINDOWS = process.platform === 'win32';

export class LocalSandbox {
  private projectId: string;
  private workDir: string;
  private running = false;
  private fakeContainerId: string | null = null;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.workDir = path.resolve(process.cwd(), '..', 'workspaces', projectId);
  }

  async start(): Promise<string> {
    await fs.mkdir(this.workDir, { recursive: true });
    this.fakeContainerId = `local-${uuidv4().substring(0, 8)}`;
    this.running = true;
    console.log(`[LocalSandbox] Started workspace: ${this.workDir}`);
    return this.fakeContainerId;
  }

  async stop(): Promise<void> {
    this.running = false;
    this.fakeContainerId = null;
    console.log(`[LocalSandbox] Stopped workspace for project ${this.projectId}`);
  }

  async exec(
    command: string,
    timeout: number = 300000,
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    if (!this.running) {
      throw new Error('Local sandbox not started');
    }

    // Translate /workspace paths to local workDir
    let cmd = command;

    // Strip "cd /workspace && " prefix — our cwd is already the workspace
    cmd = cmd.replace(/cd\s+\/workspace\s*&&\s*/g, '');

    // Replace /workspace/ references in the command with the local path
    const workDirPosix = this.workDir.replace(/\\/g, '/');
    cmd = cmd.replace(/\/workspace\//g, IS_WINDOWS ? '' : `${workDirPosix}/`);
    cmd = cmd.replace(/\/workspace\b/g, IS_WINDOWS ? '.' : workDirPosix);

    // On Windows, translate common unix commands
    if (IS_WINDOWS) {
      // nohup doesn't exist on Windows
      cmd = cmd.replace(/nohup\s+/g, '');
      // Remove trailing & for background
      cmd = cmd.replace(/\s*&\s*$/, '');
      // Replace 'which' with 'where'
      cmd = cmd.replace(/\bwhich\s+/g, 'where ');
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: this.workDir,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        shell: IS_WINDOWS ? 'cmd.exe' : '/bin/bash',
        env: {
          ...process.env,
          // Ensure node/npm are available
          PATH: process.env.PATH,
          HOME: process.env.HOME || process.env.USERPROFILE,
        },
      });
      return {
        exitCode: 0,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
      };
    } catch (error: any) {
      return {
        exitCode: error.code ?? 1,
        stdout: (error.stdout || '').trim(),
        stderr: (error.stderr || error.message || '').trim(),
      };
    }
  }

  async writeFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      const localPath = this.translatePath(filePath);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, content, 'utf-8');
      return { success: true, output: `File written: ${filePath}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async readFile(filePath: string): Promise<ToolResult> {
    try {
      const localPath = this.translatePath(filePath);
      const content = await fs.readFile(localPath, 'utf-8');
      return { success: true, output: content };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async listFiles(
    dirPath: string = '/workspace',
    recursive: boolean = false,
  ): Promise<ToolResult> {
    try {
      const localPath = this.translatePath(dirPath);

      if (recursive) {
        const entries = await this.walkDir(localPath);
        return {
          success: true,
          output: entries.length > 0 ? entries.join('\n') : '(empty directory)',
        };
      }

      const entries = await fs.readdir(localPath, { withFileTypes: true });
      const lines = entries.map((e) => `${e.isDirectory() ? 'd' : '-'} ${e.name}`);
      return {
        success: true,
        output: lines.length > 0 ? lines.join('\n') : '(empty directory)',
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  getContainerId(): string | null {
    return this.fakeContainerId;
  }

  isRunning(): boolean {
    return this.running;
  }

  /* ── Helpers ── */

  private translatePath(p: string): string {
    if (p.startsWith('/workspace')) {
      return path.join(this.workDir, p.substring('/workspace'.length));
    }
    if (path.isAbsolute(p)) {
      // Absolute path that isn't /workspace — treat as relative to workDir
      return path.join(this.workDir, p);
    }
    return path.join(this.workDir, p);
  }

  private async walkDir(
    dir: string,
    maxDepth = 5,
    depth = 0,
  ): Promise<string[]> {
    if (depth >= maxDepth) return [];
    const results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          ['node_modules', '.git', 'dist', '.next', '__pycache__'].includes(
            entry.name,
          )
        )
          continue;
        const fullPath = path.join(dir, entry.name);
        const relativePath = path
          .relative(this.workDir, fullPath)
          .replace(/\\/g, '/');
        results.push(relativePath);
        if (entry.isDirectory()) {
          results.push(
            ...(await this.walkDir(fullPath, maxDepth, depth + 1)),
          );
        }
      }
    } catch {
      /* ignore permission errors */
    }
    return results.slice(0, 200);
  }
}
