import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Globe,
  FolderTree,
  Send,
  Plus,
  Mic,
  Github,
  Settings,
  ChevronDown,
  ChevronRight,
  Pencil,
  Share2,
  Upload,
  Monitor,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Maximize2,
  XCircle,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronUp,
  Code2,
  Eye,
  FileCode,
  MoreHorizontal,
  Sparkles,
  Users,
  Bookmark,
  Terminal as TerminalIcon,
  FileText,
  Copy,
  X,
  Link2,
  Download,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { SearchModal } from '../components/SearchModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { InviteModal } from '../components/InviteModal';
import { SettingsModal } from '../components/SettingsModal';
import { useAgentStore } from '../stores/agent-store';
import { fetchProject, createProject, createGitHubRepo, pushToGitHub, shareProject, getDownloadUrl } from '../lib/api';
import { joinProject, leaveProject, createTask, cancelTask, resumeTask } from '../lib/socket';
import type { ChatMessage as ChatMessageType } from '@shared/types';

/* ── Right panel tab icons (header center) ── */
const panelTabs = [
  { id: 'browser' as const, label: 'Preview', icon: Eye, showLabel: true },
  { id: 'code' as const, label: 'Code', icon: Code2, showLabel: false },
  { id: 'terminal' as const, label: 'Terminal', icon: TerminalIcon, showLabel: false },
  { id: 'files' as const, label: 'Files', icon: FileText, showLabel: false },
  { id: 'clipboard' as const, label: 'Clipboard', icon: Copy, showLabel: false },
];

/* Inject keyframe animations once */
const animStyleId = 'masidy-build-anims';
if (typeof document !== 'undefined' && !document.getElementById(animStyleId)) {
  const style = document.createElement('style');
  style.id = animStyleId;
  style.textContent = `
    @keyframes stepSlideIn {
      from { opacity: 0; transform: translateX(-8px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes stepFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes stepPulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.15); }
    }
    @keyframes stepBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    @keyframes thinkDot {
      0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1.2); }
    }
    @keyframes progressShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptSent = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [searchOpen, setSearchOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clipboardContent, setClipboardContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState('/');
  const [bookmarked, setBookmarked] = useState(false);

  const {
    currentProject,
    setProject,
    messages,
    activeTab,
    setActiveTab,
    currentTaskId,
    isExecuting,
    isPaused,
    pauseQuestion,
    steps,
    browserScreenshot,
    files,
    selectedFile,
    terminalOutput,
    deployUrl,
    reset,
  } = useAgentStore();

  useEffect(() => {
    if (!id) return;
    const state = location.state as { initialPrompt?: string } | null;

    const initProject = async () => {
      // Helper: once we have a valid project, join socket room + send initial prompt
      const startAgent = (projectId: string, prompt?: string) => {
        joinProject(projectId);
        if (prompt && !initialPromptSent.current) {
          initialPromptSent.current = true;
          setTimeout(() => createTask(projectId, prompt), 500);
        }
      };

      try {
        // 1. Try fetching existing project from DB
        const project = await fetchProject(id);
        setProject({
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          framework: project.framework,
          status: project.status,
        });
        startAgent(project.id, state?.initialPrompt);
      } catch {
        // 2. Project not found (temp UUID) — create it via API
        try {
          const name = state?.initialPrompt?.slice(0, 50) || 'New Project';
          const newProject = await createProject({ name, description: state?.initialPrompt });
          setProject({
            id: newProject.id,
            name: newProject.name,
            slug: newProject.slug,
            description: newProject.description,
            framework: newProject.framework,
            status: newProject.status,
          });
          startAgent(newProject.id, state?.initialPrompt);
          // Replace URL with real project ID
          navigate(`/project/${newProject.id}`, { replace: true, state });
        } catch {
          // 3. Backend unreachable — set local state, still try socket connection
          setProject({
            id: id,
            name: 'Masidy 1.6 Lite',
            slug: id,
            description: 'Autonomous AI Agent',
            framework: 'react',
            status: 'active',
          });
          startAgent(id, state?.initialPrompt);
        }
      }
    };

    initProject();

    return () => {
      if (id) leaveProject(id);
      reset();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isFullscreen]);

  function handleSend() {
    const text = inputValue.trim();
    if (!text || !currentProject) return;
    if (isPaused && currentTaskId) {
      resumeTask(currentTaskId, text);
    } else {
      createTask(currentProject.id, text);
    }
    setInputValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCancel() {
    if (currentTaskId) cancelTask(currentTaskId);
  }

  function handleShare() {
    if (!currentProject) {
      setInviteOpen(true);
      return;
    }
    shareProject(currentProject.id)
      .then(({ shareUrl }) => {
        navigator.clipboard.writeText(shareUrl);
        alert(`Share link copied to clipboard!\n${shareUrl}`);
      })
      .catch(() => setInviteOpen(true));
  }

  function handlePublish() {
    if (!currentProject) return;
    const deployPrompt = `Deploy the project to production. Use the deploy tool with appropriate build and start commands.`;
    createTask(currentProject.id, deployPrompt);
  }

  function handleClose() {
    navigate('/');
  }

  async function handleGithubHeader() {
    if (!currentProject) return;
    const repoName = prompt('Repository name:', currentProject.name.replace(/\s+/g, '-').toLowerCase());
    if (!repoName) return;
    try {
      const { repoUrl, fullName } = await createGitHubRepo(currentProject.id, { name: repoName });
      // Now push code to the repo
      const { commitUrl } = await pushToGitHub(currentProject.id, fullName, `Initial commit from Masidy Agent`);
      alert(`Repository created and code pushed!\n\nRepo: ${repoUrl}\nCommit: ${commitUrl}`);
    } catch (err: any) {
      alert(`GitHub error: ${err.message}`);
    }
  }

  function handleDownloadZip() {
    if (!currentProject) return;
    window.open(getDownloadUrl(currentProject.id), '_blank');
  }

  function handleAttach() {
    fileInputRef.current?.click();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setInputValue((prev) =>
        prev + (prev ? '\n' : '') + `[Attached: ${file.name}]\n\`\`\`\n${content.slice(0, 5000)}\n\`\`\``
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleGithubInput() {
    setInputValue((prev) =>
      prev + (prev ? ' ' : '') + 'Push this code to GitHub and set up the repository.'
    );
    textareaRef.current?.focus();
  }

  function handleConnectors() {
    setSettingsOpen(true);
  }

  function handleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((prev) => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.start();
  }

  function handleExternalLink() {
    if (browserScreenshot?.url) {
      window.open(browserScreenshot.url, '_blank');
    }
  }

  function handleRefreshPreview() {
    if (!currentProject) return;
    createTask(currentProject.id, 'Refresh the preview and take a new screenshot of the running application.');
  }

  function handleCopyClipboard() {
    // Copy all terminal output or selected file to clipboard
    const content = activeTab === 'terminal' ? terminalOutput : (files.find(f => f.path === selectedFile)?.content || '');
    navigator.clipboard.writeText(content).then(() => {
      setClipboardContent(content);
      setActiveTab('clipboard' as any);
    }).catch(() => {});
  }

  function handleBookmark() {
    setBookmarked(!bookmarked);
  }

  /* ── Build a live preview blob URL from written files ── */
  const previewBlobUrl = (() => {
    if (files.length === 0) return null;
    const htmlFile = files.find(f => f.path.endsWith('index.html') || f.path.endsWith('.html'));
    if (!htmlFile) return null;

    let html = htmlFile.content;
    // Inject CSS files inline
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    for (const css of cssFiles) {
      const fileName = css.path.split('/').pop() || '';
      // Replace link tags referencing this CSS file
      const linkRegex = new RegExp(`<link[^>]*href=["'][^"']*${fileName.replace('.', '\\.')}["'][^>]*>`, 'gi');
      html = html.replace(linkRegex, `<style>${css.content}</style>`);
    }
    // If CSS wasn't linked, inject at end of head
    if (cssFiles.length > 0 && !html.includes('<style>')) {
      const allCss = cssFiles.map(f => f.content).join('\n');
      html = html.replace('</head>', `<style>${allCss}</style></head>`);
    }
    // Inject JS files inline
    const jsFiles = files.filter(f => f.path.endsWith('.js') && !f.path.includes('server') && !f.path.includes('config') && !f.path.includes('vite') && !f.path.includes('tailwind') && !f.path.includes('postcss'));
    for (const js of jsFiles) {
      const fileName = js.path.split('/').pop() || '';
      const scriptRegex = new RegExp(`<script[^>]*src=["'][^"']*${fileName.replace('.', '\\.')}["'][^>]*>\\s*</script>`, 'gi');
      html = html.replace(scriptRegex, `<script>${js.content}</script>`);
    }
    // If JS files weren't referenced via script tags, append them before </body>
    if (jsFiles.length > 0) {
      for (const js of jsFiles) {
        const fileName = js.path.split('/').pop() || '';
        if (!html.includes(js.content.substring(0, 40))) {
          // Only inject if not already present
          const scriptTag = `<script>/* ${fileName} */\n${js.content}</script>`;
          if (html.includes('</body>')) {
            html = html.replace('</body>', `${scriptTag}\n</body>`);
          } else {
            html += scriptTag;
          }
        }
      }
    }
    try {
      const blob = new Blob([html], { type: 'text/html' });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  })();

  // Generate a content fingerprint so iframe refreshes when files change
  const previewKey = files.map(f => `${f.path}:${f.content.length}`).join('|');

  /* ── Step status icon ── */
  function StepIcon({ status }: { status: string }) {
    if (status === 'completed') return <CheckCircle2 size={16} color="#22c55e" />;
    if (status === 'running') return <Loader2 size={16} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />;
    if (status === 'failed') return <AlertCircle size={16} color="#ef4444" />;
    return <Circle size={16} color="#ccc" />;
  }

  /* ── Render a single chat message ── */
  function renderMessage(msg: ChatMessageType) {
    if (msg.role === 'user') {
      return (
        <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <div
            style={{
              maxWidth: '80%',
              padding: '10px 16px',
              backgroundColor: '#f0ede8',
              borderRadius: 14,
              borderBottomRightRadius: 4,
              fontSize: 14,
              color: '#1a1a1a',
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {msg.content}
          </div>
        </div>
      );
    }

    if (msg.role === 'step' && msg.step) {
      const isRunning = msg.step.status === 'running';
      const isCompleted = msg.step.status === 'completed';
      const isFailed = msg.step.status === 'failed';
      const isFileWrite = msg.step.title?.startsWith('Writing ');
      const isTerminal = msg.step.title?.startsWith('Running:');
      const isPlan = msg.step.title?.startsWith('Planning:');
      const isDeploy = msg.step.title?.startsWith('Deploying');
      const isThinking = msg.step.title === 'Thinking...';
      const isAskUser = msg.step.title?.startsWith('Asking');

      // Pick accent color based on type
      const accentColor = isFailed ? '#ef4444' : isDeploy ? '#8b5cf6' : isFileWrite ? '#10b981' : isTerminal ? '#f59e0b' : isPlan ? '#3b82f6' : isThinking ? '#6366f1' : isAskUser ? '#d97706' : '#3b82f6';

      return (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: 4,
            padding: '7px 12px',
            borderRadius: 10,
            borderLeft: isRunning ? `2px solid ${accentColor}` : '2px solid transparent',
            backgroundColor: isRunning ? `${accentColor}08` : 'transparent',
            animation: isRunning ? 'stepSlideIn 0.3s ease-out' : 'stepFadeIn 0.4s ease-out',
            transition: 'all 0.3s ease',
            opacity: isCompleted ? 0.7 : 1,
          }}
        >
          <div style={{ marginTop: 2, position: 'relative' }}>
            {isRunning && (
              <div style={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                backgroundColor: `${accentColor}20`,
                animation: 'stepPulse 2s ease-in-out infinite',
              }} />
            )}
            <StepIcon status={msg.step.status} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: isRunning ? 600 : 500,
              color: isFailed ? '#ef4444' : isRunning ? '#1a1a1a' : '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 0.3s',
            }}>
              {msg.step.title}
            </div>
            {msg.step.durationMs != null && isCompleted && (
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>
                {(msg.step.durationMs / 1000).toFixed(1)}s
              </div>
            )}
          </div>
          {isRunning && (
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: accentColor,
              animation: 'stepBlink 1.5s ease-in-out infinite',
              flexShrink: 0, marginTop: 7,
            }} />
          )}
        </div>
      );
    }

    if (msg.role === 'thinking') {
      return (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
            padding: '8px 12px',
            fontSize: 13,
            color: '#6366f1',
            fontStyle: 'italic',
            animation: 'stepFadeIn 0.3s ease-out',
            borderLeft: '2px solid #6366f120',
          }}
        >
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#6366f1', animation: 'thinkDot 1.4s ease-in-out infinite', animationDelay: '0s' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#6366f1', animation: 'thinkDot 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#6366f1', animation: 'thinkDot 1.4s ease-in-out infinite', animationDelay: '0.4s' }} />
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.content}</span>
        </div>
      );
    }

    if (msg.role === 'error') {
      return (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: 12,
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            fontSize: 13,
            color: '#b91c1c',
            lineHeight: 1.5,
          }}
        >
          <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>{msg.content}</span>
        </div>
      );
    }

    // assistant - parse markdown-like bullets with checkmarks
    return (
      <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div
          style={{
            flex: 1,
            fontSize: 14,
            color: '#333',
            lineHeight: 1.7,
            wordBreak: 'break-word',
          }}
        >
          {msg.content.split('\n').map((line, i) => {
            // Bold text
            if (line.startsWith('**') && line.endsWith('**')) {
              return <div key={i} style={{ fontWeight: 600, color: '#1a1a1a', marginTop: i > 0 ? 8 : 0 }}>{line.replace(/\*\*/g, '')}</div>;
            }
            // Bullet with checkmark
            if (line.match(/^[\s]*[-•]\s*✅/)) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                  <span style={{ color: '#22c55e', fontSize: 15, lineHeight: '1.7' }}>✅</span>
                  <span>{line.replace(/^[\s]*[-•]\s*✅\s*/, '')}</span>
                </div>
              );
            }
            // Bullet with X mark
            if (line.match(/^[\s]*[-•]\s*❌/)) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                  <span style={{ color: '#ef4444', fontSize: 15, lineHeight: '1.7' }}>❌</span>
                  <span>{line.replace(/^[\s]*[-•]\s*❌\s*/, '')}</span>
                </div>
              );
            }
            // Regular bullet
            if (line.match(/^[\s]*[-•]\s/)) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingLeft: 4, marginBottom: 2 }}>
                  <span style={{ color: '#999' }}>•</span>
                  <span>{line.replace(/^[\s]*[-•]\s*/, '')}</span>
                </div>
              );
            }
            // Inline bold
            const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <span key={i}>
                {boldParts.map((part, j) =>
                  part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  ),
                )}
                {i < msg.content.split('\n').length - 1 && <br />}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Selected file content for Code tab ── */
  const currentFile = files.find((f) => f.path === selectedFile);
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const runningStep = steps.some((s) => s.status === 'running');

  // Fullscreen preview mode
  if (isFullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #e8e5e0' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#666' }}>Preview - {currentProject?.name || 'Project'}</span>
          <button onClick={() => setIsFullscreen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3ef' }}>
          {browserScreenshot ? (
            <img src={`data:image/png;base64,${browserScreenshot.imageBase64}`} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : deployUrl ? (
            <iframe src={deployUrl} title="Live preview" style={{ width: '100%', height: '100%', border: 'none' }} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
          ) : previewBlobUrl ? (
            <iframe key={previewKey} src={previewBlobUrl} title="Local preview" style={{ width: '100%', height: '100%', border: 'none' }} sandbox="allow-scripts allow-same-origin" />
          ) : (
            <p style={{ color: '#999' }}>No preview available yet</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f5f3ef',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Hidden file input for attach */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".txt,.js,.ts,.jsx,.tsx,.json,.css,.html,.py,.md,.csv,.xml,.yaml,.yml,.env,.sh"
      />

      {/* ── Modals ── */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NewProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={async (data) => {
          try {
            const project = await createProject(data);
            navigate(`/project/${project.id}`, {
              state: data.description ? { initialPrompt: data.description } : undefined,
            });
          } catch (err) {
            console.error('Failed to create project:', err);
          }
        }}
      />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* ────────── FULL SIDEBAR ────────── */}
      <Sidebar
        activePage="dashboard"
        onSearchClick={() => setSearchOpen(true)}
        onNewProject={() => setProjectModalOpen(true)}
        onInviteClick={() => setInviteOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* ────────── MAIN AREA ────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ══ TOP HEADER BAR ══ */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
            padding: '0 16px',
            backgroundColor: '#faf9f7',
            borderBottom: '1px solid #e8e5e0',
          }}
        >
          {/* Left: project name + action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
              {currentProject?.name || 'Masidy 1.6 Lite'}
            </span>
            <ChevronDown size={14} color="#999" style={{ cursor: 'pointer' }} />
            <div style={{ width: 1, height: 16, backgroundColor: '#e8e5e0', margin: '0 4px' }} />
            <button style={headerIconStyle} title="AI Assistant" onClick={() => textareaRef.current?.focus()}>
              <Sparkles size={15} />
            </button>
            <button style={headerIconStyle} title="Share" onClick={handleShare}>
              <Share2 size={15} />
            </button>
            <button style={headerIconStyle} title="Collaborators" onClick={handleShare}>
              <Users size={15} />
            </button>
            <button
              style={{ ...headerIconStyle, color: bookmarked ? '#f59e0b' : '#999' }}
              title="Bookmark"
              onClick={handleBookmark}
            >
              <Bookmark size={15} fill={bookmarked ? '#f59e0b' : 'none'} />
            </button>
            <button style={headerIconStyle} title="More options" onClick={() => setSettingsOpen(true)}>
              <MoreHorizontal size={15} />
            </button>
            {isExecuting && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6366f1',
                  background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginLeft: 6,
                  border: '1px solid #c7d2fe',
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: '#6366f1',
                  animation: 'stepBlink 1.5s ease-in-out infinite',
                }} />
                Building
              </span>
            )}
          </div>

          {/* Center: panel tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backgroundColor: '#f0ede8',
              borderRadius: 8,
              padding: 3,
            }}
          >
            {panelTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'clipboard') {
                      // Copy current content to clipboard and switch to clipboard view
                      handleCopyClipboard();
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tab.showLabel ? 5 : 0,
                    padding: tab.showLabel ? '5px 12px' : '5px 8px',
                    fontSize: 12,
                    fontWeight: 500,
                    color: isActive ? '#1a1a1a' : '#999',
                    backgroundColor: isActive ? '#fff' : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={13} />
                  {tab.showLabel && tab.label}
                </button>
              );
            })}
            <button style={{ ...headerIconStyle, padding: '5px 6px' }} onClick={() => setSettingsOpen(true)}>
              <MoreHorizontal size={13} />
            </button>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={headerIconStyle} title="GitHub" onClick={handleGithubHeader}>
              <Github size={16} />
            </button>
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                color: '#555',
                backgroundColor: '#fff',
                border: '1px solid #e0ddd8',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Share2 size={13} />
              Share
            </button>
            <button
              onClick={handlePublish}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#1a1a1a',
                backgroundColor: '#f59e0b',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Upload size={13} />
              Publish
            </button>
            <button style={headerIconStyle} title="Close" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ══ SPLIT PANELS ══ */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* ──── LEFT: CHAT PANEL ──── */}
          <div
            style={{
              width: '45%',
              minWidth: 340,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid #e8e5e0',
              backgroundColor: '#fff',
            }}
          >
            {/* Messages area */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px 20px',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', padding: 40 }}>
                  <Sparkles size={32} color="#d97706" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 16, fontWeight: 500, color: '#666', marginBottom: 4 }}>What do you want to build?</p>
                  <p style={{ fontSize: 13, color: '#bbb' }}>Describe your project and Masidy will build it for you</p>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* "Masidy will continue working" status */}
            {isPaused && (
              <div
                style={{
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#d97706',
                }}
              >
                <Loader2 size={13} color="#d97706" style={{ animation: 'spin 2s linear infinite' }} />
                {pauseQuestion || 'Masidy will continue working after your response'}
              </div>
            )}

            {/* Task progress card (bottom of chat, above input) */}
            {steps.length > 0 && (
              <div
                style={{
                  margin: '0 16px 8px',
                }}
              >
                <TaskProgressCard
                  steps={steps}
                  title={currentProject?.name || 'Working...'}
                  isExecuting={isExecuting}
                  isPaused={isPaused}
                />
              </div>
            )}

            {/* Input area */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #f0ede8',
                backgroundColor: '#faf9f7',
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0ddd8',
                  borderRadius: 14,
                  padding: '12px 16px',
                  transition: 'border-color 0.15s',
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isPaused ? 'Type your answer...' : 'Send a message to Masidy'}
                  rows={2}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: 14,
                    color: '#1a1a1a',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    backgroundColor: 'transparent',
                  }}
                />
                {/* Bottom toolbar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button style={inputIconStyle} title="Attach file" onClick={handleAttach}>
                      <Plus size={16} />
                    </button>
                    <button style={inputIconStyle} title="GitHub" onClick={handleGithubInput}>
                      <Github size={16} />
                    </button>
                    <button style={inputIconStyle} title="Connectors & Settings" onClick={handleConnectors}>
                      <Link2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isExecuting && (
                      <button
                        onClick={handleCancel}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#ef4444',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          marginRight: 4,
                        }}
                      >
                        <XCircle size={12} />
                        Stop
                      </button>
                    )}
                    <button style={inputIconStyle} title="Voice input" onClick={handleVoice}>
                      <Mic size={16} />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: inputValue.trim() ? '#f59e0b' : '#e0ddd8',
                        color: inputValue.trim() ? '#fff' : '#aaa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: inputValue.trim() ? 'pointer' : 'default',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ──── RIGHT: PREVIEW / CODE / TERMINAL / FILES PANEL ──── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff',
              overflow: 'hidden',
            }}
          >
            {/* Preview toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                borderBottom: '1px solid #f0ede8',
                backgroundColor: '#faf9f7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Desktop / Mobile toggle */}
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: '#f0ede8',
                    borderRadius: 6,
                    padding: 2,
                  }}
                >
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    style={{
                      padding: '4px 8px',
                      border: 'none',
                      borderRadius: 4,
                      backgroundColor: previewMode === 'desktop' ? '#fff' : 'transparent',
                      color: previewMode === 'desktop' ? '#1a1a1a' : '#999',
                      cursor: 'pointer',
                      display: 'flex',
                      boxShadow: previewMode === 'desktop' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    style={{
                      padding: '4px 8px',
                      border: 'none',
                      borderRadius: 4,
                      backgroundColor: previewMode === 'mobile' ? '#fff' : 'transparent',
                      color: previewMode === 'mobile' ? '#1a1a1a' : '#999',
                      cursor: 'pointer',
                      display: 'flex',
                      boxShadow: previewMode === 'mobile' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <Smartphone size={14} />
                  </button>
                </div>

                {/* Home icon */}
                <button style={previewToolbarBtnStyle} title="Home" onClick={() => setPreviewUrl('/')}>
                  <Globe size={14} />
                </button>

                {/* URL bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    backgroundColor: '#f0ede8',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#888',
                    minWidth: 100,
                  }}
                >
                  {deployUrl || browserScreenshot?.url || (previewBlobUrl ? 'local://preview' : previewUrl)}
                </div>

                {/* Action buttons */}
                <button style={previewToolbarBtnStyle} title="Open in new tab" onClick={handleExternalLink}>
                  <ExternalLink size={14} />
                </button>
                <button style={previewToolbarBtnStyle} title="Refresh preview" onClick={handleRefreshPreview}>
                  <RefreshCw size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {deployUrl ? (
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#16a34a',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    <ExternalLink size={12} />
                    Live
                  </a>
                ) : previewBlobUrl ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#6366f1',
                      backgroundColor: '#eef2ff',
                      border: '1px solid #c7d2fe',
                      borderRadius: 6,
                    }}
                  >
                    <Eye size={11} />
                    Preview
                  </span>
                ) : null}
                <button
                  onClick={handleDownloadZip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#555',
                    backgroundColor: '#fff',
                    border: '1px solid #e0ddd8',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Download size={12} />
                  Download ZIP
                </button>
                <button style={previewToolbarBtnStyle} title="Fullscreen" onClick={() => setIsFullscreen(true)}>
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f3ef',
              }}
            >
              {activeTab === 'browser' && (
                <div
                  style={{
                    width: previewMode === 'mobile' ? 375 : '100%',
                    height: '100%',
                    backgroundColor: '#fff',
                    margin: previewMode === 'mobile' ? '20px auto' : 0,
                    borderRadius: previewMode === 'mobile' ? 16 : 0,
                    boxShadow: previewMode === 'mobile' ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {browserScreenshot ? (
                    <img
                      src={`data:image/png;base64,${browserScreenshot.imageBase64}`}
                      alt="Browser preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : deployUrl ? (
                    <iframe
                      src={deployUrl}
                      title="Live preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  ) : previewBlobUrl ? (
                    <iframe
                      key={previewKey}
                      src={previewBlobUrl}
                      title="Local preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      {isExecuting ? (
                        /* Building animation */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                          <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                          }}>
                            <Loader2 size={24} color="#fff" style={{ animation: 'spin 1.5s linear infinite' }} />
                            <div style={{
                              position: 'absolute', inset: -4, borderRadius: 20,
                              border: '2px solid #6366f120',
                              animation: 'stepPulse 2s ease-in-out infinite',
                            }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                              Building your project...
                            </p>
                            <p style={{ fontSize: 13, color: '#888' }}>
                              {files.length > 0
                                ? `${files.length} file${files.length > 1 ? 's' : ''} written — waiting for HTML to preview`
                                : 'AI is planning and writing code'}
                            </p>
                          </div>
                          {/* Shimmer progress bar */}
                          <div style={{
                            width: 200, height: 3, backgroundColor: '#e8e5e0',
                            borderRadius: 2, overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', width: '60%',
                              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)',
                              borderRadius: 2, backgroundSize: '200% 100%',
                              animation: 'progressShimmer 2s linear infinite',
                            }} />
                          </div>
                        </div>
                      ) : (
                        /* Static skeleton when idle */
                        <>
                          <div
                            style={{
                              width: 280,
                              margin: '0 auto 24px',
                              padding: 20,
                              borderRadius: 12,
                              border: '1px solid #e8e5e0',
                            }}
                          >
                            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e0ddd8' }} />
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e0ddd8' }} />
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e0ddd8' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ height: 8, backgroundColor: '#f0ede8', borderRadius: 4, marginBottom: 8 }} />
                                <div style={{ height: 8, backgroundColor: '#f0ede8', borderRadius: 4, width: '60%' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ height: 8, backgroundColor: '#f0ede8', borderRadius: 4, marginBottom: 8 }} />
                                <div style={{ height: 8, backgroundColor: '#f0ede8', borderRadius: 4, width: '80%' }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                              <div style={{ flex: 1, height: 40, backgroundColor: '#f0ede8', borderRadius: 6 }} />
                              <div style={{ flex: 1, height: 40, backgroundColor: '#f0ede8', borderRadius: 6 }} />
                            </div>
                          </div>
                          <p style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                            Preview will appear here
                          </p>
                          <p style={{ fontSize: 12, color: '#bbb' }}>
                            Send a message to start building your project
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'code' && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#1e1e1e',
                    color: '#d4d4d4',
                    overflow: 'auto',
                    padding: 0,
                  }}
                >
                  {files.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        overflow: 'auto',
                        backgroundColor: '#252526',
                        borderBottom: '1px solid #3c3c3c',
                      }}
                    >
                      {files.map((f) => {
                        const name = f.path.split('/').pop() || f.path;
                        const isActive = selectedFile === f.path;
                        return (
                          <button
                            key={f.path}
                            onClick={() => useAgentStore.getState().setSelectedFile(f.path)}
                            style={{
                              padding: '8px 16px',
                              fontSize: 12,
                              color: isActive ? '#fff' : '#999',
                              backgroundColor: isActive ? '#1e1e1e' : 'transparent',
                              border: 'none',
                              borderBottom: isActive ? '2px solid #007acc' : '2px solid transparent',
                              cursor: 'pointer',
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <pre
                    style={{
                      padding: 16,
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.6,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {currentFile ? currentFile.content : '// No files yet. The agent will write code here.'}
                  </pre>
                </div>
              )}

              {activeTab === 'terminal' && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#0d1117',
                    color: '#c9d1d9',
                    overflow: 'auto',
                    padding: 16,
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.6,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {terminalOutput || '$ Waiting for commands...'}
                  </pre>
                </div>
              )}

              {activeTab === 'files' && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fff',
                    overflow: 'auto',
                    padding: 16,
                  }}
                >
                  {files.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#999',
                      }}
                    >
                      <FolderTree size={32} color="#ccc" />
                      <p style={{ fontSize: 14, marginTop: 12 }}>No files yet</p>
                      <p style={{ fontSize: 12, color: '#bbb' }}>Files will appear here as the agent creates them</p>
                    </div>
                  ) : (
                    <div>
                      {files.map((f) => (
                        <button
                          key={f.path}
                          onClick={() => {
                            useAgentStore.getState().setSelectedFile(f.path);
                            setActiveTab('code');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            backgroundColor: selectedFile === f.path ? '#f0ede8' : 'transparent',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 13,
                            color: '#444',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedFile !== f.path) e.currentTarget.style.backgroundColor = '#faf9f7';
                          }}
                          onMouseLeave={(e) => {
                            if (selectedFile !== f.path) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <FileCode size={14} color="#888" />
                          <span style={{ flex: 1 }}>{f.path}</span>
                          <span style={{ fontSize: 11, color: '#bbb' }}>{f.language || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clipboard tab */}
              {(activeTab as string) === 'clipboard' && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fff',
                    overflow: 'auto',
                    padding: 16,
                  }}
                >
                  {clipboardContent ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>Clipboard Content</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(clipboardContent)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            fontSize: 12,
                            color: '#555',
                            backgroundColor: '#f5f3ef',
                            border: '1px solid #e0ddd8',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          <Copy size={12} />
                          Copy
                        </button>
                      </div>
                      <pre
                        style={{
                          padding: 12,
                          margin: 0,
                          fontSize: 12,
                          lineHeight: 1.6,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          backgroundColor: '#f8f6f3',
                          borderRadius: 8,
                          border: '1px solid #e8e5e0',
                          color: '#333',
                        }}
                      >
                        {clipboardContent}
                      </pre>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#999',
                      }}
                    >
                      <Copy size={32} color="#ccc" />
                      <p style={{ fontSize: 14, marginTop: 12 }}>Clipboard is empty</p>
                      <p style={{ fontSize: 12, color: '#bbb' }}>Copied content will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom branding */}
            <div
              style={{
                padding: '8px 16px',
                borderTop: '1px solid #f0ede8',
                backgroundColor: '#faf9f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, color: '#ccc' }}>from</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#999', letterSpacing: '-0.01em' }}>masidy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ── Task progress card (bottom of chat) ── */
function TaskProgressCard({
  steps,
  title,
  isExecuting,
  isPaused,
}: {
  steps: { stepIndex: number; title: string; status: string }[];
  title: string;
  isExecuting: boolean;
  isPaused: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const completed = steps.filter((s) => s.status === 'completed').length;
  const failed = steps.filter((s) => s.status === 'failed').length;
  const running = steps.some((s) => s.status === 'running');
  const progress = steps.length > 0 ? (completed / steps.length) * 100 : 0;
  const currentStep = steps.find((s) => s.status === 'running');

  return (
    <div
      style={{
        padding: '12px 14px',
        background: running
          ? 'linear-gradient(135deg, #faf9f7 0%, #f5f0ff 100%)'
          : '#faf9f7',
        borderRadius: 14,
        border: running ? '1px solid #e0d4f5' : '1px solid #e8e5e0',
        transition: 'all 0.4s ease',
        boxShadow: running ? '0 2px 12px rgba(99, 102, 241, 0.06)' : 'none',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: 0,
        }}
      >
        {/* Animated icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: running
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : completed === steps.length && steps.length > 0
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : '#e8e5e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
            transition: 'background 0.4s ease',
          }}
        >
          {running ? (
            <Loader2 size={18} color="#fff" style={{ animation: 'spin 1.5s linear infinite' }} />
          ) : completed === steps.length && steps.length > 0 ? (
            <CheckCircle2 size={18} color="#fff" />
          ) : (
            <Code2 size={16} color="#999" />
          )}
          {running && (
            <div style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 12,
              border: '2px solid #6366f130',
              animation: 'stepPulse 2s ease-in-out infinite',
            }} />
          )}
        </div>

        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1a1a1a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {isPaused ? (
              <span style={{ color: '#d97706' }}>Waiting for your response...</span>
            ) : running ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#6366f1', fontWeight: 500 }}>{currentStep?.title?.substring(0, 40) || 'Working...'}</span>
              </span>
            ) : (
              <span style={{ color: '#10b981' }}>Completed</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
            {completed} / {steps.length}
          </span>
          {expanded ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
        </div>
      </button>

      {/* Progress bar */}
      <div style={{
        height: 3,
        backgroundColor: '#e8e5e0',
        borderRadius: 2,
        marginTop: 10,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: running
            ? 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)'
            : 'linear-gradient(90deg, #10b981, #059669)',
          borderRadius: 2,
          transition: 'width 0.5s ease',
          backgroundSize: running ? '200% 100%' : '100% 100%',
          animation: running ? 'progressShimmer 2s linear infinite' : 'none',
        }} />
      </div>

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0ede8' }}>
          {steps.map((step, i) => {
            const isStepRunning = step.status === 'running';
            const isStepDone = step.status === 'completed';
            const isStepFailed = step.status === 'failed';
            return (
              <div
                key={step.stepIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                  fontSize: 12,
                  color: isStepDone ? '#888' : isStepRunning ? '#6366f1' : isStepFailed ? '#ef4444' : '#bbb',
                  animation: `stepFadeIn 0.3s ease-out ${i * 0.02}s both`,
                }}
              >
                {isStepDone ? (
                  <CheckCircle2 size={13} color="#10b981" />
                ) : isStepRunning ? (
                  <Loader2 size={13} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                ) : isStepFailed ? (
                  <AlertCircle size={13} color="#ef4444" />
                ) : (
                  <Circle size={13} color="#ddd" />
                )}
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: isStepRunning ? 500 : 400,
                }}>{step.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Shared styles ── */
const headerIconStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#999',
  padding: 4,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const inputIconStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#aaa',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const previewToolbarBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#999',
  padding: 4,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
