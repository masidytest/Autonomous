import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import type { ToolResult } from '../../../shared/types.js';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const MEMORY_LIMIT = process.env.SANDBOX_MEMORY_LIMIT || '512m';
const CPU_LIMIT = parseFloat(process.env.SANDBOX_CPU_LIMIT || '1');
const DEFAULT_TIMEOUT = parseInt(process.env.SANDBOX_TIMEOUT || '300000', 10);

function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)([kmg]?)b?$/i);
  if (!match) return 512 * 1024 * 1024;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || '').toLowerCase();
  switch (unit) {
    case 'k': return num * 1024;
    case 'm': return num * 1024 * 1024;
    case 'g': return num * 1024 * 1024 * 1024;
    default: return num;
  }
}

export class SandboxManager {
  private container: Docker.Container | null = null;
  private containerId: string | null = null;
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  async start(): Promise<string> {
    const shortId = uuidv4().substring(0, 8);
    const containerName = `masidy-sandbox-${this.projectId.substring(0, 8)}-${shortId}`;

    const container = await docker.createContainer({
      Image: 'masidy-sandbox',
      name: containerName,
      Cmd: ['sleep', 'infinity'],
      WorkingDir: '/workspace',
      HostConfig: {
        Memory: parseMemoryLimit(MEMORY_LIMIT),
        NanoCpus: CPU_LIMIT * 1e9,
        CapDrop: ['ALL'],
        CapAdd: ['CHOWN', 'SETUID', 'SETGID', 'NET_BIND_SERVICE'],
        SecurityOpt: ['no-new-privileges'],
        NetworkMode: 'bridge',
      },
      Tty: false,
      OpenStdin: false,
    });

    await container.start();
    this.container = container;
    this.containerId = container.id;

    // Ensure /workspace exists and is owned by node
    await this.exec('mkdir -p /workspace && chown node:node /workspace', 5000);

    return container.id;
  }

  async stop(): Promise<void> {
    if (this.container) {
      try {
        await this.container.stop({ t: 5 });
      } catch (e: any) {
        // Container might already be stopped
      }
      try {
        await this.container.remove({ force: true });
      } catch (e: any) {
        // Container might already be removed
      }
      this.container = null;
      this.containerId = null;
    }
  }

  async exec(
    command: string,
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    if (!this.container) {
      throw new Error('Sandbox container not started');
    }

    const exec = await this.container.exec({
      Cmd: ['bash', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeout}ms: ${command.substring(0, 100)}`));
      }, timeout);

      exec.start({ Tty: false }, (err: any, stream: any) => {
        if (err) {
          clearTimeout(timer);
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', (chunk: Buffer) => {
          // Docker stream multiplexing: first 8 bytes are header
          // byte 0: stream type (1=stdout, 2=stderr)
          // bytes 4-7: payload size (big-endian)
          let offset = 0;
          while (offset < chunk.length) {
            if (offset + 8 > chunk.length) {
              // Incomplete header, treat rest as stdout
              stdout += chunk.subarray(offset).toString('utf-8');
              break;
            }
            const streamType = chunk[offset];
            const payloadSize = chunk.readUInt32BE(offset + 4);
            const payload = chunk.subarray(offset + 8, offset + 8 + payloadSize).toString('utf-8');

            if (streamType === 2) {
              stderr += payload;
            } else {
              stdout += payload;
            }
            offset += 8 + payloadSize;
          }
        });

        stream.on('end', async () => {
          clearTimeout(timer);
          try {
            const inspectData = await exec.inspect();
            resolve({
              exitCode: inspectData.ExitCode ?? 0,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
            });
          } catch {
            resolve({ exitCode: 0, stdout: stdout.trim(), stderr: stderr.trim() });
          }
        });

        stream.on('error', (streamErr: Error) => {
          clearTimeout(timer);
          reject(streamErr);
        });
      });
    });
  }

  async writeFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      // Ensure directory exists
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (dir) {
        await this.exec(`mkdir -p "${dir}"`);
      }
      // Use base64 to safely write content
      const encoded = Buffer.from(content).toString('base64');
      await this.exec(`echo "${encoded}" | base64 -d > "${filePath}"`);
      return { success: true, output: `File written: ${filePath}` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async readFile(filePath: string): Promise<ToolResult> {
    try {
      const result = await this.exec(`cat "${filePath}"`);
      if (result.exitCode !== 0) {
        return { success: false, output: '', error: result.stderr || 'File not found' };
      }
      return { success: true, output: result.stdout };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async listFiles(dirPath: string = '/workspace', recursive: boolean = false): Promise<ToolResult> {
    try {
      const cmd = recursive
        ? `find "${dirPath}" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | head -200`
        : `ls -la "${dirPath}"`;
      const result = await this.exec(cmd);
      if (result.exitCode !== 0) {
        return { success: false, output: '', error: result.stderr || 'Directory not found' };
      }
      return { success: true, output: result.stdout };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  getContainerId(): string | null {
    return this.containerId;
  }

  isRunning(): boolean {
    return this.container !== null;
  }
}
