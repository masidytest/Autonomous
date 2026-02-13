// ============ WebSocket Events ============

export type ServerEvent =
  | { type: 'task:started'; taskId: string; projectId: string }
  | { type: 'task:planning'; taskId: string; plan: TaskPlan }
  | { type: 'step:started'; taskId: string; step: StepUpdate }
  | { type: 'step:output'; taskId: string; stepIndex: number; output: string }
  | { type: 'step:completed'; taskId: string; step: StepUpdate }
  | { type: 'step:failed'; taskId: string; step: StepUpdate; error: string }
  | { type: 'task:completed'; taskId: string; result: string }
  | { type: 'task:failed'; taskId: string; error: string }
  | { type: 'task:paused'; taskId: string; question: string }
  | { type: 'file:changed'; projectId: string; path: string; content: string; language?: string }
  | { type: 'terminal:output'; taskId: string; output: string }
  | { type: 'browser:screenshot'; taskId: string; url: string; imageBase64: string }
  | { type: 'agent:thinking'; taskId: string; thought: string }
  | { type: 'agent:message'; taskId: string; content: string }
  | { type: 'deploy:completed'; projectId: string; url: string };

export type ClientEvent =
  | { type: 'task:create'; projectId: string; prompt: string }
  | { type: 'task:cancel'; taskId: string }
  | { type: 'task:resume'; taskId: string; answer: string }
  | { type: 'terminal:input'; projectId: string; data: string }
  | { type: 'project:join'; projectId: string }
  | { type: 'project:leave'; projectId: string };

// ============ Step Update ============

export interface StepUpdate {
  stepIndex: number;
  type: StepType;
  title: string;
  status: StepStatus;
  reasoning?: string;
  output?: string;
  durationMs?: number;
}

export type StepType =
  | 'plan'
  | 'code'
  | 'terminal'
  | 'browser'
  | 'file_write'
  | 'file_read'
  | 'search'
  | 'deploy'
  | 'think'
  | 'ask_user';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// ============ Agent Context ============

export interface AgentContext {
  projectId: string;
  taskId: string;
  workDir: string;
  containerId?: string;
  fileTree: FileTreeNode[];
  conversationHistory: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
}

// ============ File Tree ============

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  language?: string;
}

// ============ Task Plan ============

export interface TaskPlan {
  goal: string;
  steps: TaskPlanStep[];
  estimatedTime?: string;
}

export interface TaskPlanStep {
  title: string;
  type: StepType;
  description: string;
}

// ============ API Types ============

export interface CreateProjectRequest {
  name: string;
  description?: string;
  framework?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  framework: string | null;
  status: string | null;
  containerId: string | null;
  deployUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  prompt: string;
  status: string;
  plan: TaskPlan | null;
  result: string | null;
  tokensUsed: number | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  steps?: StepResponse[];
}

export interface StepResponse {
  id: string;
  taskId: string;
  stepIndex: number;
  type: string;
  status: string;
  title: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  reasoning: string | null;
  durationMs: number | null;
  createdAt: string;
}

// ============ Tool Results ============

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============ Chat Message (Frontend) ============

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'thinking' | 'step' | 'error';
  content: string;
  timestamp: number;
  step?: StepUpdate;
}
