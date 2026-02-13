import { getToken } from './auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const API_BASE = `${BACKEND_URL}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// ── Auth ──

export interface UserData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
  plan: string | null;
}

export async function fetchCurrentUser(): Promise<UserData> {
  return request('/auth/me');
}

// ── Projects ──

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  framework: string | null;
  status: string | null;
  deployUrl?: string | null;
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

// ── Tasks ──

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

// ── GitHub ──

export async function createGitHubRepo(
  projectId: string,
  data: { name: string; description?: string; isPrivate?: boolean }
) {
  return request<{ repoUrl: string; fullName: string }>(`/projects/${projectId}/github/create-repo`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function pushToGitHub(projectId: string, repoFullName: string, message?: string) {
  return request<{ commitSha: string; commitUrl: string }>(`/projects/${projectId}/github/push`, {
    method: 'POST',
    body: JSON.stringify({ repoFullName, message }),
  });
}

// ── Share ──

export async function shareProject(projectId: string) {
  return request<{ shareUrl: string }>(`/projects/${projectId}/share`, {
    method: 'POST',
  });
}

// ── Download ──

export function getDownloadUrl(projectId: string): string {
  const token = getToken();
  return `${API_BASE}/projects/${projectId}/download${token ? `?token=${token}` : ''}`;
}
