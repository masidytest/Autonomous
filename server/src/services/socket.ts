import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { db } from './database.js';
import { projects } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const orchestrators = new Map<string, AgentOrchestrator>();

export function createSocketServer(httpServer: HttpServer): SocketServer {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'https://masidy-agent.vercel.app',
  ].filter(Boolean) as string[];

  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin: any, callback: any) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
          return callback(null, true);
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join project room
    socket.on('project:join', ({ projectId }: { projectId: string }) => {
      socket.join(`project:${projectId}`);
      console.log(`Client ${socket.id} joined project ${projectId}`);
    });

    // Leave project room
    socket.on('project:leave', ({ projectId }: { projectId: string }) => {
      socket.leave(`project:${projectId}`);
      console.log(`Client ${socket.id} left project ${projectId}`);
    });

    // Create a task
    socket.on(
      'task:create',
      async ({ projectId, prompt, skills }: { projectId: string; prompt: string; skills?: { name: string; content: string }[] }) => {
        try {
          // Get project (or auto-create if it doesn't exist yet)
          let project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
          });

          if (!project) {
            // Auto-create the project so the orchestrator can proceed
            const slug = `project-${uuidv4().substring(0, 8)}`;
            // Extract a meaningful short name from the prompt
            const nameMatch = prompt.match(/(?:build|create|make|design|develop)\s+(?:a\s+|an\s+|the\s+)?(.{3,40}?)(?:\s+with|\s+using|\s+for|\s+that|\.|$)/i);
            const name = nameMatch ? nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1) : (prompt.slice(0, 40) || 'New Project');
            try {
              [project] = await db
                .insert(projects)
                .values({ name, slug, description: prompt })
                .returning();
              console.log(`[socket] Auto-created project ${project.id} for prompt`);
            } catch (insertErr: any) {
              console.error('Failed to auto-create project:', insertErr);
              socket.emit('error', { message: 'Failed to create project' });
              return;
            }
          }

          // Cancel any existing orchestrator for this project (e.g., one waiting on ask_user)
          const existing = orchestrators.get(project.id);
          if (existing) {
            existing.cancel();
          }

          const orchestrator = new AgentOrchestrator(io, project.id, project.slug);
          orchestrators.set(project.id, orchestrator);

          // Inject enabled skills into the orchestrator
          if (skills && skills.length > 0) {
            orchestrator.setSkills(skills);
          }

          // Execute in background (don't await)
          orchestrator.execute(prompt).catch((err) => {
            console.error(`Task execution error for project ${project!.id}:`, err);
          });
        } catch (error: any) {
          console.error('Error creating task:', error);
          socket.emit('error', { message: error.message });
        }
      }
    );

    // Cancel task
    socket.on('task:cancel', ({ projectId }: { projectId?: string; taskId?: string }) => {
      if (projectId) {
        const orchestrator = orchestrators.get(projectId);
        if (orchestrator) orchestrator.cancel();
      }
    });

    // Resume task (answer to ask_user)
    socket.on(
      'task:resume',
      ({ projectId, answer }: { projectId?: string; taskId?: string; answer: string }) => {
        if (projectId) {
          const orchestrator = orchestrators.get(projectId);
          if (orchestrator) orchestrator.resume(answer);
        }
      }
    );

    // Terminal input
    socket.on(
      'terminal:input',
      ({ projectId, data }: { projectId: string; data: string }) => {
        const orchestrator = orchestrators.get(projectId);
        if (orchestrator) {
          orchestrator.sendTerminalInput(data);
        }
      }
    );

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitToProject(
  io: SocketServer,
  projectId: string,
  eventType: string,
  data: any
): void {
  io.to(`project:${projectId}`).emit(eventType, data);
}
