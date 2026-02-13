import { io, type Socket } from 'socket.io-client';
import { useAgentStore } from '../stores/agent-store';
import { v4 as uuidv4 } from 'uuid';
import type { StepUpdate, TaskPlan } from '@shared/types';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    setupListeners(socket);
  }
  return socket;
}

function setupListeners(sock: Socket) {
  const store = useAgentStore.getState;

  sock.on('connect', () => {
    console.log('Socket connected:', sock.id);
  });

  sock.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  sock.on('task:started', (data: { taskId: string; projectId: string }) => {
    useAgentStore.setState({
      currentTaskId: data.taskId,
      isExecuting: true,
      steps: [],
      terminalOutput: '',
    });
  });

  sock.on('task:planning', (data: { taskId: string; plan: TaskPlan }) => {
    useAgentStore.setState({ taskPlan: data.plan, taskStatus: 'planning' });
    const store = useAgentStore.getState();
    store.addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: `**Plan: ${data.plan.goal}**\n\n${data.plan.steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}`,
      timestamp: Date.now(),
    });
  });

  sock.on('step:started', (data: { taskId: string; step: StepUpdate }) => {
    useAgentStore.getState().addStep(data.step);
    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'step',
      content: data.step.title,
      timestamp: Date.now(),
      step: data.step,
    });
  });

  sock.on('step:completed', (data: { taskId: string; step: StepUpdate }) => {
    useAgentStore.getState().updateStep(data.step);
    // Update the step message
    useAgentStore.setState((state) => ({
      messages: state.messages.map((m) =>
        m.step?.stepIndex === data.step.stepIndex
          ? { ...m, step: data.step }
          : m
      ),
    }));
  });

  sock.on('step:failed', (data: { taskId: string; step: StepUpdate; error: string }) => {
    useAgentStore.getState().updateStep(data.step);
    useAgentStore.setState((state) => ({
      messages: state.messages.map((m) =>
        m.step?.stepIndex === data.step.stepIndex
          ? { ...m, step: data.step }
          : m
      ),
    }));
  });

  sock.on('step:output', (data: { taskId: string; stepIndex: number; output: string }) => {
    useAgentStore.getState().appendTerminalOutput(data.output);
  });

  sock.on('task:completed', (data: { taskId: string; result: string }) => {
    useAgentStore.setState({ isExecuting: false, taskStatus: 'completed' });
    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: data.result || 'Task completed successfully.',
      timestamp: Date.now(),
    });
  });

  sock.on('task:failed', (data: { taskId: string; error: string }) => {
    useAgentStore.setState({ isExecuting: false, taskStatus: 'failed' });
    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'error',
      content: `Task failed: ${data.error}`,
      timestamp: Date.now(),
    });
  });

  sock.on('task:paused', (data: { taskId: string; question: string }) => {
    useAgentStore.setState({
      isPaused: true,
      pauseQuestion: data.question,
    });
    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: data.question,
      timestamp: Date.now(),
    });
  });

  sock.on(
    'file:changed',
    (data: { projectId: string; path: string; content: string; language?: string }) => {
      useAgentStore.getState().updateFile(data.path, data.content, data.language);
      useAgentStore.getState().setActiveTab('code');
    }
  );

  sock.on('terminal:output', (data: { taskId: string; output: string }) => {
    useAgentStore.getState().appendTerminalOutput(data.output);
    useAgentStore.getState().setActiveTab('terminal');
  });

  sock.on(
    'browser:screenshot',
    (data: { taskId: string; url: string; imageBase64: string }) => {
      useAgentStore.setState({
        browserScreenshot: { url: data.url, imageBase64: data.imageBase64 },
      });
      useAgentStore.getState().setActiveTab('browser');
    }
  );

  sock.on('agent:thinking', (data: { taskId: string; thought: string }) => {
    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'thinking',
      content: data.thought,
      timestamp: Date.now(),
    });
  });

  sock.on('agent:message', (data: { taskId: string; content: string }) => {
    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: data.content,
      timestamp: Date.now(),
    });
  });

  sock.on('error', (data: { message: string }) => {
    console.error('Socket error:', data.message);
  });
}

export function joinProject(projectId: string) {
  getSocket().emit('project:join', { projectId });
}

export function leaveProject(projectId: string) {
  getSocket().emit('project:leave', { projectId });
}

export function createTask(projectId: string, prompt: string) {
  useAgentStore.getState().addMessage({
    id: uuidv4(),
    role: 'user',
    content: prompt,
    timestamp: Date.now(),
  });
  getSocket().emit('task:create', { projectId, prompt });
}

export function cancelTask(taskId: string) {
  getSocket().emit('task:cancel', { taskId });
}

export function resumeTask(taskId: string, answer: string) {
  useAgentStore.setState({ isPaused: false, pauseQuestion: null });
  useAgentStore.getState().addMessage({
    id: uuidv4(),
    role: 'user',
    content: answer,
    timestamp: Date.now(),
  });
  getSocket().emit('task:resume', { taskId, answer });
}

export function sendTerminalInput(projectId: string, data: string) {
  getSocket().emit('terminal:input', { projectId, data });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
