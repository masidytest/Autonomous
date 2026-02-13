import { Router } from 'express';
import { db } from '../services/database.js';
import { projects, tasks, steps } from '../../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Health check
router.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List projects
router.get('/api/projects', async (_req, res) => {
  try {
    const result = await db.query.projects.findMany({
      orderBy: [desc(projects.updatedAt)],
    });
    res.json(result);
  } catch (error: any) {
    console.error('GET /api/projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/api/projects', async (req, res) => {
  try {
    const { name, description, framework } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate slug
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      uuidv4().substring(0, 6);

    const [project] = await db
      .insert(projects)
      .values({
        name,
        description: description || null,
        framework: framework || null,
        slug,
      })
      .returning();

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/api/projects/:id', async (req, res) => {
  try {
    await db.delete(projects).where(eq(projects.id, req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List tasks for a project
router.get('/api/projects/:id/tasks', async (req, res) => {
  try {
    const result = await db.query.tasks.findMany({
      where: eq(tasks.projectId, req.params.id),
      orderBy: [desc(tasks.createdAt)],
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task with steps
router.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, req.params.id),
      with: {
        steps: {
          orderBy: [steps.stepIndex],
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all recent tasks (for sidebar)
router.get('/api/tasks', async (_req, res) => {
  try {
    const result = await db.query.tasks.findMany({
      orderBy: [desc(tasks.createdAt)],
      limit: 20,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List steps for a task
router.get('/api/tasks/:id/steps', async (req, res) => {
  try {
    const result = await db.query.steps.findMany({
      where: eq(steps.taskId, req.params.id),
      orderBy: [steps.stepIndex],
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
