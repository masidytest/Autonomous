import { io, type Socket } from 'socket.io-client';
import { useAgentStore } from '../stores/agent-store';
import { useUsageStore } from '../stores/usage-store';
import { useSkillsStore } from '../stores/skills-store';
import { toastFriendly } from '../stores/toast-store';
import { v4 as uuidv4 } from 'uuid';
import type { StepUpdate, TaskPlan } from '@shared/types';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setupListeners(socket);
  }
  return socket;
}

function setupListeners(sock: Socket) {
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
    // Track build start time
    useUsageStore.getState().setBuildStartTime(Date.now());
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

    // Periodic check-in toast every 5 completed steps
    const completedSteps = useAgentStore.getState().steps.filter(s => s.status === 'completed').length;
    if (completedSteps > 0 && completedSteps % 5 === 0) {
      const checkIns = [
        'Making great progress on your project!',
        'Things are coming together nicely.',
        'Your project is shaping up well!',
        'Almost there — just finishing up the details.',
        'Looking good so far! Hang tight.',
      ];
      const msg = checkIns[Math.floor(Math.random() * checkIns.length)];
      toastFriendly(`${msg} (${completedSteps} steps done)`, 'Build Update');
    }
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
    // Track completed task in usage store (triggers achievements, friendly messages, upgrade prompts)
    useUsageStore.getState().trackTaskCompleted();
  });

  sock.on('task:failed', (data: { taskId: string; error: string }) => {
    useAgentStore.setState({ isExecuting: false, taskStatus: 'failed' });

    // Provide actionable error messages
    let errorContent = data.error;
    if (data.error.includes('credit balance') || data.error.includes('billing')) {
      errorContent = 'AI credits depleted — Please update your Anthropic API key with a funded account. Go to console.anthropic.com to check your billing.';
    } else if (data.error.includes('Invalid') && data.error.includes('API key')) {
      errorContent = 'Invalid API key — The server\'s Anthropic API key is incorrect or expired. Update it in your deployment environment variables.';
    } else if (data.error.includes('overloaded') || data.error.includes('529')) {
      errorContent = 'AI service is temporarily overloaded. Please try again in a few moments.';
    }

    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'error',
      content: errorContent,
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
      // Don't auto-switch to code tab — keep showing preview so user sees live updates
      const currentTab = useAgentStore.getState().activeTab;
      if (currentTab === 'clipboard' || currentTab === 'files') {
        useAgentStore.getState().setActiveTab('browser');
      }
      // Track file creation in usage store
      useUsageStore.getState().trackFileCreated();
    }
  );

  sock.on('terminal:output', (data: { taskId: string; output: string }) => {
    useAgentStore.getState().appendTerminalOutput(data.output);
    // Don't auto-switch to terminal — keep preview visible
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

  sock.on('deploy:completed', (data: { projectId: string; url: string }) => {
    useAgentStore.setState({ deployUrl: data.url });
    useAgentStore.getState().addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: `Project deployed successfully! Live at: ${data.url}`,
      timestamp: Date.now(),
    });
    // Track deployment in usage store
    useUsageStore.getState().trackDeploy();
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
  // Send enabled skill names so the server can inject them into the system prompt
  const enabledSkills = useSkillsStore.getState().getEnabledSkills().map((s) => ({
    name: s.name,
    content: s.content,
  }));
  getSocket().emit('task:create', { projectId, prompt, skills: enabledSkills });
}

export function cancelTask(taskId: string, projectId?: string) {
  getSocket().emit('task:cancel', { taskId, projectId });
}

export function resumeTask(taskId: string, answer: string, projectId?: string) {
  useAgentStore.setState({ isPaused: false, pauseQuestion: null });
  useAgentStore.getState().addMessage({
    id: uuidv4(),
    role: 'user',
    content: answer,
    timestamp: Date.now(),
  });
  getSocket().emit('task:resume', { taskId, answer, projectId });
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
