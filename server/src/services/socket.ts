import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { db } from './database.js';
import { projects } from '@shared/schema.js';
import { eq } from 'drizzle-orm';

const orchestrators = new Map<string, AgentOrchestrator>();

export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
      async ({ projectId, prompt }: { projectId: string; prompt: string }) => {
        try {
          // Get project slug
          const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
          });

          if (!project) {
            socket.emit('error', { message: 'Project not found' });
            return;
          }

          const orchestrator = new AgentOrchestrator(io, projectId, project.slug);
          orchestrators.set(projectId, orchestrator);

          // Execute in background (don't await)
          orchestrator.execute(prompt).catch((err) => {
            console.error(`Task execution error for project ${projectId}:`, err);
          });
        } catch (error: any) {
          console.error('Error creating task:', error);
          socket.emit('error', { message: error.message });
        }
      }
    );

    // Cancel task
    socket.on('task:cancel', ({ taskId }: { taskId: string }) => {
      for (const [, orchestrator] of orchestrators) {
        orchestrator.cancel();
      }
    });

    // Resume task (answer to ask_user)
    socket.on(
      'task:resume',
      ({ taskId, answer }: { taskId: string; answer: string }) => {
        for (const [, orchestrator] of orchestrators) {
          orchestrator.resume(answer);
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
