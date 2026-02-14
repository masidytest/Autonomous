import { getToken } from './auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const API_BASE = `${BACKEND_URL}/api`;

/**
 * Extract a short, meaningful project name from a long prompt.
 * "Build a crypto currency platform" → "Crypto Currency Platform"
 * "You are an e-commerce strategist with extensive..." → "E-commerce Strategy Platform"
 * "Create a landing page for my bakery" → "Bakery Landing Page"
 */
export function extractProjectName(prompt: string): string {
  const p = prompt.trim();

  // If it's already short enough, capitalize and use it
  if (p.length <= 40) {
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  // Try to extract "build/create/make X" pattern
  const buildMatch = p.match(/(?:build|create|make|design|develop)\s+(?:a\s+|an\s+|the\s+)?(.{3,40}?)(?:\s+with|\s+using|\s+for|\s+that|\.|$)/i);
  if (buildMatch) {
    const name = buildMatch[1].trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Try to find the main subject — look for key nouns after common preambles
  const cleaned = p
    .replace(/^(you are|i want|i need|please|can you|help me|i'd like|i would like)\s+/i, '')
    .replace(/^(an?\s+|the\s+)/i, '')
    .replace(/\s+(?:with|using|that|which|who|where|when|please|and|also|including).*$/i, '');

  if (cleaned.length <= 50 && cleaned.length >= 3) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Fallback: first 40 chars of cleaned text
  const fallback = cleaned.substring(0, 40).trim();
  return (fallback || p.substring(0, 40)).charAt(0).toUpperCase() + (fallback || p.substring(0, 40)).slice(1);
}

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
