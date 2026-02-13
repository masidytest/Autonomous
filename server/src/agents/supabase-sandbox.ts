/**
 * SupabaseSandbox — Cloud-native sandbox using Supabase for file storage
 * and job tracking. All files persist in Supabase DB + Storage.
 *
 * - File read/write/list → sandbox_files table in Supabase
 * - Code execution → sandbox_jobs table + server-side runner
 * - Storage bucket "workspaces" for binary/large files
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  private supabase: SupabaseClient | null = null;
  private running = false;
  private containerId: string | null = null;
  private edgeFunctionUrl: string | null = null;
  private tempDir: string | null = null;
  private localOnly = false;

  constructor(projectId: string) {
    this.projectId = projectId;

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.warn(
        '[SupabaseSandbox] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — running in local-only mode',
      );
      this.localOnly = true;
      return;
    }

    this.supabase = createClient(supabaseUrl, serviceKey);

    // Edge Function URL (if deployed)
    this.edgeFunctionUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/execute-code`
      : null;
  }

  async start(): Promise<string> {
    this.containerId = `supa-${uuidv4().substring(0, 8)}`;
    this.running = true;

    // Create a temp working directory for command execution
    this.tempDir = path.join(os.tmpdir(), 'masidy-sandbox', this.projectId);
    await fs.mkdir(this.tempDir, { recursive: true });

    // Sync existing files from Supabase to temp dir
    await this.syncFilesToLocal();

    console.log(
      `[SupabaseSandbox] Started for project ${this.projectId} (temp: ${this.tempDir})`,
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

    console.log(
      `[SupabaseSandbox] Stopped for project ${this.projectId}`,
    );
  }

  async exec(
    command: string,
    timeout: number = 300000,
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    if (!this.running || !this.tempDir) {
      throw new Error('Sandbox not started');
    }

    // Log the job to Supabase (if connected)
    const jobId = uuidv4();
    if (this.supabase) {
      await this.supabase.from('sandbox_jobs').insert({
        id: jobId,
        project_id: this.projectId,
        type: 'exec',
        command,
        status: 'running',
        timeout_ms: timeout,
        started_at: new Date().toISOString(),
      }).catch(() => {});
    }

    // Sync files from Supabase to temp dir before execution
    if (this.supabase) {
      await this.syncFilesToLocal();
    }

    // Translate /workspace paths
    let cmd = command;
    cmd = cmd.replace(/cd\s+\/workspace\s*&&\s*/g, '');

    const isWindows = process.platform === 'win32';
    if (isWindows) {
      cmd = cmd.replace(/\/workspace\//g, '');
      cmd = cmd.replace(/\/workspace\b/g, '.');
      cmd = cmd.replace(/nohup\s+/g, '');
      cmd = cmd.replace(/\s*&\s*$/, '');
      cmd = cmd.replace(/\bwhich\s+/g, 'where ');
    } else {
      const posixDir = this.tempDir.replace(/\\/g, '/');
      cmd = cmd.replace(/\/workspace\//g, `${posixDir}/`);
      cmd = cmd.replace(/\/workspace\b/g, posixDir);
    }

    let result: { exitCode: number; stdout: string; stderr: string };

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: this.tempDir,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        shell: isWindows ? 'cmd.exe' : '/bin/bash',
        env: {
          ...process.env,
          PATH: process.env.PATH,
          HOME: process.env.HOME || process.env.USERPROFILE,
        },
      });

      result = {
        exitCode: 0,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
      };
    } catch (error: any) {
      result = {
        exitCode: error.code ?? 1,
        stdout: (error.stdout || '').trim(),
        stderr: (error.stderr || error.message || '').trim(),
      };
    }

    // Sync any new/changed files back to Supabase (if connected)
    if (this.supabase) {
      await this.syncFilesToSupabase();
    }

    // Update the job record (if Supabase connected)
    if (this.supabase) {
      await this.supabase
        .from('sandbox_jobs')
        .update({
          status: result.exitCode === 0 ? 'completed' : 'failed',
          exit_code: result.exitCode,
          stdout: result.stdout.substring(0, 50000),
          stderr: result.stderr.substring(0, 50000),
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .catch(() => {});
    }

    return result;
  }

  async writeFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      const normalizedPath = this.normalizePath(filePath);

      // Write to Supabase DB (if connected)
      if (this.supabase) {
        const { error } = await this.supabase.from('sandbox_files').upsert(
          {
            project_id: this.projectId,
            file_path: normalizedPath,
            content,
            language: this.detectLanguage(normalizedPath),
            size_bytes: Buffer.byteLength(content, 'utf-8'),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'project_id,file_path' },
        );

        if (error) {
          console.warn('[SupabaseSandbox] writeFile upsert error:', error.message);
        }

        // Also upload to Storage bucket
        await this.supabase.storage
          .from('workspaces')
          .upload(`${this.projectId}/${normalizedPath}`, new Blob([content]), {
            upsert: true,
            contentType: 'text/plain',
          })
          .catch(() => {});
      }

      // Always write to local temp dir
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

      // Try Supabase DB first
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('sandbox_files')
          .select('content')
          .eq('project_id', this.projectId)
          .eq('file_path', normalizedPath)
          .single();

        if (!error && data) {
          return { success: true, output: data.content };
        }
      }

      // Fallback: read from local temp dir
      if (this.tempDir) {
        const localPath = path.join(this.tempDir, normalizedPath);
        try {
          const content = await fs.readFile(localPath, 'utf-8');
          return { success: true, output: content };
        } catch {
          // file doesn't exist locally either
        }
      }

      return {
        success: false,
        output: '',
        error: `File not found: ${filePath}`,
      };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async listFiles(
    dirPath: string = '/workspace',
    recursive: boolean = false,
  ): Promise<ToolResult> {
    try {
      const normalizedDir = this.normalizePath(dirPath);

      // Try Supabase DB first
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('sandbox_files')
          .select('file_path')
          .eq('project_id', this.projectId)
          .order('file_path');

        if (!error && data && data.length > 0) {
          let files = data.map((f: { file_path: string }) => f.file_path);

          if (normalizedDir && normalizedDir !== '.') {
            files = files.filter(
              (f: string) =>
                f.startsWith(normalizedDir + '/') || f === normalizedDir,
            );
          }

          if (!recursive) {
            const prefix = normalizedDir && normalizedDir !== '.'
              ? normalizedDir + '/'
              : '';
            const seen = new Set<string>();
            files = files
              .map((f: string) => {
                const relative = prefix ? f.substring(prefix.length) : f;
                if (!relative) return null;
                const firstSlash = relative.indexOf('/');
                const entry = firstSlash === -1 ? relative : relative.substring(0, firstSlash);
                const isDir = firstSlash !== -1;
                return { name: entry, isDir };
              })
              .filter((f: any) => f && !seen.has(f.name) && (seen.add(f.name), true))
              .map((f: any) => `${f.isDir ? 'd' : '-'} ${f.name}`);
          }

          return {
            success: true,
            output: files.length > 0 ? files.join('\n') : '(empty directory)',
          };
        }
      }

      // Fallback: list from local temp dir
      if (this.tempDir) {
        const localFiles = await this.walkDir(this.tempDir);
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

  private detectLanguage(filePath: string): string | null {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
      ts: 'typescript', tsx: 'typescript', mts: 'typescript',
      py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
      html: 'html', css: 'css', scss: 'scss', less: 'less',
      json: 'json', md: 'markdown', mdx: 'markdown',
      yaml: 'yaml', yml: 'yaml', toml: 'toml', xml: 'xml',
      sql: 'sql', sh: 'bash', bash: 'bash', zsh: 'bash',
      dockerfile: 'dockerfile', makefile: 'makefile',
      c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
      swift: 'swift', kt: 'kotlin', scala: 'scala',
      php: 'php', r: 'r', lua: 'lua', dart: 'dart',
      vue: 'vue', svelte: 'svelte',
    };
    return langMap[ext] || null;
  }

  /** Sync files from Supabase DB → local temp dir (for command execution) */
  private async syncFilesToLocal(): Promise<void> {
    if (!this.tempDir || !this.supabase) return;

    try {
      const { data } = await this.supabase
        .from('sandbox_files')
        .select('file_path, content')
        .eq('project_id', this.projectId);

      if (!data || data.length === 0) return;

      for (const file of data) {
        const localPath = path.join(this.tempDir, file.file_path);
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, file.content, 'utf-8');
      }
    } catch {
      /* best effort sync */
    }
  }

  /** Sync files from local temp dir → Supabase DB (after command execution) */
  private async syncFilesToSupabase(): Promise<void> {
    if (!this.tempDir || !this.supabase) return;

    try {
      const localFiles = await this.walkDir(this.tempDir);

      for (const relativePath of localFiles) {
        const localPath = path.join(this.tempDir, relativePath);
        try {
          const stat = await fs.stat(localPath);
          if (!stat.isFile() || stat.size > 5 * 1024 * 1024) continue; // Skip dirs and files > 5MB

          const content = await fs.readFile(localPath, 'utf-8');
          const normalizedPath = relativePath.replace(/\\/g, '/');

          await this.supabase.from('sandbox_files').upsert(
            {
              project_id: this.projectId,
              file_path: normalizedPath,
              content,
              language: this.detectLanguage(normalizedPath),
              size_bytes: stat.size,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'project_id,file_path' },
          );
        } catch {
          /* skip binary/unreadable files */
        }
      }
    } catch {
      /* best effort sync */
    }
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
          ['node_modules', '.git', 'dist', '.next', '__pycache__', '.cache'].includes(
            entry.name,
          )
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
