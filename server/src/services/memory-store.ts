import { v4 as uuidv4 } from 'uuid';

/* ── Record types (mirror Drizzle schema shapes) ── */

export interface ProjectRecord {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  slug: string;
  framework: string | null;
  status: string;
  containerId: string | null;
  deployUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  userId: string | null;
  prompt: string;
  status: string;
  plan: any | null;
  result: string | null;
  tokensUsed: number;
  durationMs: number | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface StepRecord {
  id: string;
  taskId: string;
  stepIndex: number;
  type: string;
  status: string;
  title: string;
  input: any | null;
  output: any | null;
  reasoning: string | null;
  durationMs: number | null;
  createdAt: Date;
}

export interface MessageRecord {
  id: string;
  taskId: string;
  role: string;
  content: string;
  toolName: string | null;
  toolInput: any | null;
  toolOutput: any | null;
  createdAt: Date;
}

export interface FileRecord {
  id: string;
  projectId: string;
  path: string;
  content: string | null;
  language: string | null;
  isDirectory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* ── In-memory store ── */

class MemoryStore {
  private projects = new Map<string, ProjectRecord>();
  private tasks = new Map<string, TaskRecord>();
  private steps = new Map<string, StepRecord>();
  private messages = new Map<string, MessageRecord>();
  private files = new Map<string, FileRecord>();

  /* ── Projects ── */

  getProjects(): ProjectRecord[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  getProject(id: string): ProjectRecord | undefined {
    return this.projects.get(id);
  }

  createProject(data: {
    name: string;
    description?: string | null;
    slug: string;
    framework?: string | null;
  }): ProjectRecord {
    const now = new Date();
    const project: ProjectRecord = {
      id: uuidv4(),
      userId: null,
      name: data.name,
      description: data.description || null,
      slug: data.slug,
      framework: data.framework || null,
      status: 'active',
      containerId: null,
      deployUrl: null,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(project.id, project);
    return project;
  }

  updateProject(id: string, data: Partial<ProjectRecord>): void {
    const existing = this.projects.get(id);
    if (existing) {
      this.projects.set(id, { ...existing, ...data, updatedAt: new Date() });
    }
  }

  deleteProject(id: string): void {
    this.projects.delete(id);
    // Cascade delete related records
    for (const [tid, task] of this.tasks) {
      if (task.projectId === id) this.deleteTaskCascade(tid);
    }
    for (const [fid, file] of this.files) {
      if (file.projectId === id) this.files.delete(fid);
    }
  }

  /* ── Tasks ── */

  createTask(data: {
    projectId: string;
    prompt: string;
    status?: string;
  }): TaskRecord {
    const task: TaskRecord = {
      id: uuidv4(),
      projectId: data.projectId,
      userId: null,
      prompt: data.prompt,
      status: data.status || 'queued',
      plan: null,
      result: null,
      tokensUsed: 0,
      durationMs: null,
      error: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  updateTask(id: string, data: Partial<TaskRecord>): void {
    const existing = this.tasks.get(id);
    if (existing) {
      this.tasks.set(id, { ...existing, ...data });
    }
  }

  getTask(id: string): TaskRecord | undefined {
    return this.tasks.get(id);
  }

  getTasksByProject(projectId: string): TaskRecord[] {
    return Array.from(this.tasks.values())
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTaskWithSteps(
    id: string,
  ): (TaskRecord & { steps: StepRecord[] }) | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    return { ...task, steps: this.getStepsByTask(id) };
  }

  /* ── Steps ── */

  createStep(data: {
    taskId: string;
    stepIndex: number;
    type: string;
    status: string;
    title: string;
    input?: any;
    output?: any;
    durationMs?: number;
  }): StepRecord {
    const step: StepRecord = {
      id: uuidv4(),
      taskId: data.taskId,
      stepIndex: data.stepIndex,
      type: data.type,
      status: data.status,
      title: data.title,
      input: data.input || null,
      output: data.output || null,
      reasoning: null,
      durationMs: data.durationMs || null,
      createdAt: new Date(),
    };
    this.steps.set(step.id, step);
    return step;
  }

  getStepsByTask(taskId: string): StepRecord[] {
    return Array.from(this.steps.values())
      .filter((s) => s.taskId === taskId)
      .sort((a, b) => a.stepIndex - b.stepIndex);
  }

  /* ── Messages ── */

  createMessage(data: {
    taskId: string;
    role: string;
    content: string;
  }): MessageRecord {
    const msg: MessageRecord = {
      id: uuidv4(),
      taskId: data.taskId,
      role: data.role,
      content: data.content,
      toolName: null,
      toolInput: null,
      toolOutput: null,
      createdAt: new Date(),
    };
    this.messages.set(msg.id, msg);
    return msg;
  }

  /* ── Files ── */

  upsertFile(data: {
    projectId: string;
    path: string;
    content: string;
    language?: string;
  }): FileRecord {
    // Check if file already exists for this project+path
    for (const [id, file] of this.files) {
      if (file.projectId === data.projectId && file.path === data.path) {
        const updated: FileRecord = {
          ...file,
          content: data.content,
          language: data.language || file.language,
          updatedAt: new Date(),
        };
        this.files.set(id, updated);
        return updated;
      }
    }
    // Create new
    const file: FileRecord = {
      id: uuidv4(),
      projectId: data.projectId,
      path: data.path,
      content: data.content,
      language: data.language || null,
      isDirectory: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(file.id, file);
    return file;
  }

  findFile(projectId: string, filePath: string): FileRecord | undefined {
    for (const file of this.files.values()) {
      if (file.projectId === projectId && file.path === filePath) return file;
    }
    return undefined;
  }

  /* ── Internal helpers ── */

  private deleteTaskCascade(taskId: string): void {
    this.tasks.delete(taskId);
    for (const [sid, step] of this.steps) {
      if (step.taskId === taskId) this.steps.delete(sid);
    }
    for (const [mid, msg] of this.messages) {
      if (msg.taskId === taskId) this.messages.delete(mid);
    }
  }
}

export const store = new MemoryStore();
