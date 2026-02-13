const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  framework: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchProjects(): Promise<ProjectData[]> {
  return request('/projects');
}

export async function fetchProject(id: string): Promise<ProjectData> {
  return request(`/projects/${id}`);
}

export async function createProject(data: {
  name: string;
  description?: string;
  framework?: string;
}): Promise<ProjectData> {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/projects/${id}`, { method: 'DELETE' });
}

export interface TaskData {
  id: string;
  projectId: string;
  prompt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllTasks(): Promise<TaskData[]> {
  return request('/tasks');
}

export async function fetchTasks(projectId: string): Promise<TaskData[]> {
  return request(`/projects/${projectId}/tasks`);
}

export async function fetchTask(taskId: string) {
  return request(`/tasks/${taskId}`);
}
