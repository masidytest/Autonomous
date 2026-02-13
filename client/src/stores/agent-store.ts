import { create } from 'zustand';
import type { StepUpdate, TaskPlan, ChatMessage } from '@shared/types';

interface FileEntry {
  path: string;
  content: string;
  language?: string;
}

interface BrowserScreenshot {
  url: string;
  imageBase64: string;
}

interface ProjectState {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  framework: string | null;
  status: string | null;
}

interface AgentState {
  // Project
  currentProject: ProjectState | null;
  setProject: (project: ProjectState | null) => void;

  // Task
  currentTaskId: string | null;
  taskPlan: TaskPlan | null;
  taskStatus: string | null;
  setTaskId: (id: string | null) => void;
  setTaskPlan: (plan: TaskPlan | null) => void;
  setTaskStatus: (status: string | null) => void;

  // Steps
  steps: StepUpdate[];
  addStep: (step: StepUpdate) => void;
  updateStep: (step: StepUpdate) => void;

  // Messages
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  // Files
  files: FileEntry[];
  selectedFile: string | null;
  updateFile: (path: string, content: string, language?: string) => void;
  setSelectedFile: (path: string | null) => void;

  // Terminal
  terminalOutput: string;
  appendTerminalOutput: (output: string) => void;

  // Browser
  browserScreenshot: BrowserScreenshot | null;
  setBrowserScreenshot: (screenshot: BrowserScreenshot | null) => void;

  // Execution state
  isExecuting: boolean;
  isPaused: boolean;
  pauseQuestion: string | null;
  setExecuting: (executing: boolean) => void;
  setPaused: (paused: boolean, question?: string | null) => void;

  // Active right panel tab
  activeTab: 'browser' | 'code' | 'terminal' | 'files' | 'clipboard';
  setActiveTab: (tab: 'browser' | 'code' | 'terminal' | 'files' | 'clipboard') => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentProject: null,
  currentTaskId: null,
  taskPlan: null,
  taskStatus: null,
  steps: [],
  messages: [],
  files: [],
  selectedFile: null,
  terminalOutput: '',
  browserScreenshot: null,
  isExecuting: false,
  isPaused: false,
  pauseQuestion: null,
  activeTab: 'terminal' as const,
};

export const useAgentStore = create<AgentState>((set) => ({
  ...initialState,

  setProject: (project) => set({ currentProject: project }),

  setTaskId: (id) => set({ currentTaskId: id }),
  setTaskPlan: (plan) => set({ taskPlan: plan }),
  setTaskStatus: (status) => set({ taskStatus: status }),

  addStep: (step) =>
    set((state) => ({ steps: [...state.steps, step] })),

  updateStep: (step) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.stepIndex === step.stepIndex ? { ...s, ...step } : s
      ),
    })),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateFile: (path, content, language) =>
    set((state) => {
      const existing = state.files.findIndex((f) => f.path === path);
      const newFiles = [...state.files];
      if (existing >= 0) {
        newFiles[existing] = { path, content, language };
      } else {
        newFiles.push({ path, content, language });
      }
      return { files: newFiles, selectedFile: path };
    }),

  setSelectedFile: (path) => set({ selectedFile: path }),

  appendTerminalOutput: (output) =>
    set((state) => ({
      terminalOutput: state.terminalOutput + output + '\n',
    })),

  setBrowserScreenshot: (screenshot) => set({ browserScreenshot: screenshot }),

  setExecuting: (executing) => set({ isExecuting: executing }),

  setPaused: (paused, question = null) =>
    set({ isPaused: paused, pauseQuestion: question }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  reset: () => set(initialState),
}));
