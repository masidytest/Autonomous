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
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { SearchModal } from '../components/SearchModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { InviteModal } from '../components/InviteModal';
import { SettingsModal } from '../components/SettingsModal';
import { useAgentStore } from '../stores/agent-store';
import { fetchProject } from '../lib/api';
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

export function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptSent = useRef(false);
  const [inputValue, setInputValue] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [searchOpen, setSearchOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    reset,
  } = useAgentStore();

  useEffect(() => {
    if (!id) return;
    fetchProject(id)
      .then((project) => {
        setProject({
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          framework: project.framework,
          status: project.status,
        });
        joinProject(project.id);

        const state = location.state as { initialPrompt?: string } | null;
        if (state?.initialPrompt && !initialPromptSent.current) {
          initialPromptSent.current = true;
          setTimeout(() => {
            createTask(project.id, state.initialPrompt!);
          }, 500);
        }
      })
      .catch(() => {
        // Fallback: use mock project so IDE works without backend
        setProject({
          id: id,
          name: 'Masidy 1.6 Lite',
          slug: id,
          description: 'Autonomous AI Agent',
          framework: 'react',
          status: 'active',
        });
      });

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
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

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
      return (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: 6,
            padding: '8px 12px',
            backgroundColor: msg.step.status === 'running' ? '#f8f6f3' : 'transparent',
            borderRadius: 10,
            transition: 'background-color 0.2s',
          }}
        >
          <div style={{ marginTop: 2 }}>
            <StepIcon status={msg.step.status} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>
              {msg.step.title}
            </div>
            {msg.step.reasoning && (
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {msg.step.reasoning}
              </div>
            )}
            {msg.step.durationMs && msg.step.status === 'completed' && (
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                {(msg.step.durationMs / 1000).toFixed(1)}s
              </div>
            )}
          </div>
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
            marginBottom: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: '#999',
            fontStyle: 'italic',
          }}
        >
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          {msg.content}
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

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f5f3ef',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Modals ── */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NewProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={(data) => console.log('Create project:', data)}
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
            {[Sparkles, Share2, Users, Bookmark, MoreHorizontal].map((Icon, i) => (
              <button key={i} style={headerIconStyle}>
                <Icon size={15} />
              </button>
            ))}
            {isExecuting && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#3b82f6',
                  backgroundColor: '#eff6ff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  marginLeft: 4,
                }}
              >
                <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                Running
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
                    if (tab.id !== 'clipboard') setActiveTab(tab.id as any);
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
            <button style={{ ...headerIconStyle, padding: '5px 6px' }}>
              <MoreHorizontal size={13} />
            </button>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={headerIconStyle} title="GitHub">
              <Github size={16} />
            </button>
            <button
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
            <button style={headerIconStyle} title="Close">
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
                Masidy will continue working after your response
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
                    <button style={inputIconStyle} title="Attach">
                      <Plus size={16} />
                    </button>
                    <button style={inputIconStyle} title="GitHub">
                      <Github size={16} />
                    </button>
                    <button style={inputIconStyle} title="Connectors">
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
                    <button style={inputIconStyle} title="Voice">
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
                <button style={previewToolbarBtnStyle}>
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
                  /
                </div>

                {/* Refresh buttons */}
                <button style={previewToolbarBtnStyle} title="Open externally">
                  <ExternalLink size={14} />
                </button>
                <button style={previewToolbarBtnStyle} title="Refresh">
                  <RefreshCw size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
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
                  <Pencil size={12} />
                  Edit
                </button>
                <button style={previewToolbarBtnStyle} title="Fullscreen">
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
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      {/* Skeleton card */}
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
                        Loading preview, please wait...
                      </p>
                      <p style={{ fontSize: 12, color: '#bbb' }}>
                        <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Download the app</a>
                        {' '}and get notified when ready.
                      </p>
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
  const running = steps.some((s) => s.status === 'running');

  return (
    <div
      style={{
        padding: '10px 14px',
        backgroundColor: '#faf9f7',
        borderRadius: 12,
        border: '1px solid #e8e5e0',
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
        {/* Thumbnail placeholder */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            backgroundColor: '#e8e5e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 4, gap: 2 }}>
            <div style={{ height: 3, backgroundColor: '#d4d1cc', borderRadius: 1, width: '80%' }} />
            <div style={{ height: 3, backgroundColor: '#d4d1cc', borderRadius: 1, width: '60%' }} />
            <div style={{ height: 3, backgroundColor: '#d4d1cc', borderRadius: 1, width: '70%' }} />
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#444',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {running ? (
              <>
                <Loader2 size={12} color="#d97706" style={{ animation: 'spin 1s linear infinite', display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {title}
              </>
            ) : (
              title
            )}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
            {isPaused ? 'Waiting for user...' : running ? 'Working...' : 'Completed'}
          </div>
        </div>

        <span
          style={{
            fontSize: 12,
            color: '#999',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {completed} / {steps.length}
        </span>
        {expanded ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0ede8' }}>
          {steps.map((step) => (
            <div
              key={step.stepIndex}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0',
                fontSize: 12,
                color: step.status === 'completed' ? '#888' : step.status === 'running' ? '#3b82f6' : '#bbb',
              }}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 size={13} color="#22c55e" />
              ) : step.status === 'running' ? (
                <Loader2 size={13} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
              ) : step.status === 'failed' ? (
                <AlertCircle size={13} color="#ef4444" />
              ) : (
                <Circle size={13} color="#ddd" />
              )}
              <span>{step.title}</span>
            </div>
          ))}
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
