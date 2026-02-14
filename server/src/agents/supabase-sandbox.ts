/**
 * ProjectSandbox — Reliable local sandbox for file storage and command execution.
 *
 * Files are stored in a local temp directory per project. The Drizzle DB `files`
 * table (managed by the orchestrator) is the permanent storage layer.
 *
 * No dependency on Supabase sandbox_files / sandbox_jobs tables.
 */
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import type { ToolResult } from '../../../shared/types.js';

const execAsync = promisify(execCb);

export class SupabaseSandbox {
  private projectId: string;
  private running = false;
  private containerId: string | null = null;
  private tempDir: string | null = null;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  async start(): Promise<string> {
    this.containerId = `sandbox-${uuidv4().substring(0, 8)}`;
    this.running = true;

    // Create a persistent working directory for this project
    this.tempDir = path.join(os.tmpdir(), 'masidy-sandbox', this.projectId);
    await fs.mkdir(this.tempDir, { recursive: true });

    console.log(
      `[Sandbox] Started for project ${this.projectId} (dir: ${this.tempDir})`,
    );
    return this.containerId;
  }

  async stop(): Promise<void> {
    this.running = false;
    this.containerId = null;

    // Clean up temp directory
    if (this.tempDir) {
      try {
        await fs.rm(this.tempDir, { recursive: true, force: true });
      } catch {
        /* ignore cleanup errors */
      }
      this.tempDir = null;
    }

    console.log(`[Sandbox] Stopped for project ${this.projectId}`);
  }

  async exec(
    command: string,
    timeout: number = 300000,
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    if (!this.running || !this.tempDir) {
      throw new Error('Sandbox not started');
    }

    // Translate /workspace paths to the temp dir
    let cmd = command;
    cmd = cmd.replace(/cd\s+\/workspace\s*&&\s*/g, '');

    const isWindows = process.platform === 'win32';
    if (isWindows) {
      // On Windows, strip /workspace references and translate Linux commands
      cmd = cmd.replace(/\/workspace\//g, '.\\');
      cmd = cmd.replace(/\/workspace\b/g, '.');
      cmd = cmd.replace(/nohup\s+/g, '');
      cmd = cmd.replace(/\s*&\s*$/, '');
      cmd = cmd.replace(/\bwhich\s+/g, 'where ');
      // Translate common Linux commands to Windows equivalents
      cmd = cmd.replace(/^ls\b/, 'dir');
      cmd = cmd.replace(/^cat\s+/g, 'type ');
      cmd = cmd.replace(/^rm\s+-rf?\s+/g, 'rmdir /s /q ');
      cmd = cmd.replace(/^mkdir\s+-p\s+/g, 'mkdir ');
      cmd = cmd.replace(/^cp\s+-r?\s+/g, 'xcopy /E /I /Y ');
      cmd = cmd.replace(/^mv\s+/g, 'move ');
      cmd = cmd.replace(/^chmod\b.*$/g, 'echo chmod not needed on Windows');
      // Handle 2>&1 redirect (works on both)
    } else {
      const posixDir = this.tempDir.replace(/\\/g, '/');
      cmd = cmd.replace(/\/workspace\//g, `${posixDir}/`);
      cmd = cmd.replace(/\/workspace\b/g, posixDir);
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: this.tempDir,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        shell: isWindows ? 'cmd.exe' : '/bin/sh',
        env: {
          ...process.env,
          PATH: process.env.PATH,
          HOME: process.env.HOME || process.env.USERPROFILE || '/tmp',
          NODE_ENV: 'development',
        },
      });

      return {
        exitCode: 0,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
      };
    } catch (error: any) {
      const exitCode =
        typeof error.code === 'number'
          ? error.code
          : (error.status ?? 1);
      console.error(
        `[Sandbox] exec error for "${cmd.substring(0, 100)}":`,
        error.message?.substring(0, 200),
      );
      return {
        exitCode,
        stdout: (error.stdout || '').trim(),
        stderr: (error.stderr || error.message || '').trim(),
      };
    }
  }

  async writeFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      const normalizedPath = this.normalizePath(filePath);

      // Write to local temp dir (source of truth for command execution)
      if (this.tempDir) {
        const localPath = path.join(this.tempDir, normalizedPath);
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, content, 'utf-8');
      }

      return { success: true, output: `File written: ${filePath}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async readFile(filePath: string): Promise<ToolResult> {
    try {
      const normalizedPath = this.normalizePath(filePath);

      if (this.tempDir) {
        const localPath = path.join(this.tempDir, normalizedPath);
        const content = await fs.readFile(localPath, 'utf-8');
        return { success: true, output: content };
      }

      return {
        success: false,
        output: '',
        error: `File not found: ${filePath}`,
      };
    } catch (error: any) {
      return { success: false, output: '', error: `File not found: ${filePath}` };
    }
  }

  async listFiles(
    dirPath: string = '/workspace',
    recursive: boolean = false,
  ): Promise<ToolResult> {
    try {
      if (this.tempDir) {
        const normalizedDir = this.normalizePath(dirPath);
        const targetDir = normalizedDir && normalizedDir !== '.'
          ? path.join(this.tempDir, normalizedDir)
          : this.tempDir;

        const localFiles = await this.walkDir(targetDir);
        if (localFiles.length > 0) {
          return { success: true, output: localFiles.join('\n') };
        }
      }

      return { success: true, output: '(empty directory)' };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  getContainerId(): string | null {
    return this.containerId;
  }

  isRunning(): boolean {
    return this.running;
  }

  /* ── Private helpers ── */

  private normalizePath(p: string): string {
    return p
      .replace(/^\/workspace\/?/, '')
      .replace(/^\.\//, '')
      .replace(/\\/g, '/');
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
          [
            'node_modules', '.git', 'dist', '.next', '__pycache__',
            '.cache', '.vite', '.turbo', 'coverage',
          ].includes(entry.name)
        )
          continue;
        const fullPath = path.join(dir, entry.name);
        const relativePath = path
          .relative(this.tempDir!, fullPath)
          .replace(/\\/g, '/');
        if (entry.isFile()) {
          results.push(relativePath);
        } else if (entry.isDirectory()) {
          results.push(
            ...(await this.walkDir(fullPath, maxDepth, depth + 1)),
          );
        }
      }
    } catch {
      /* ignore permission errors */
    }
    return results.slice(0, 500);
  }
}
