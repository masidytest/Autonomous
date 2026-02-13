import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Bell,
  Zap,
  Send,
  Smile,
  Mic,
  Github,
  Share2,
  Paperclip,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { SearchModal } from '../components/SearchModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { InviteModal } from '../components/InviteModal';
import { SettingsModal } from '../components/SettingsModal';
import { createProject } from '../lib/api';
import { isAuthenticated, savePendingPrompt } from '../lib/auth';

const quickChips = [
  'Create a landing page',
  'Build a REST API',
  'Fix a bug in my code',
  'Add authentication',
  'Write unit tests',
  'Deploy my app',
];

export function Dashboard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Ctrl+K / Cmd+K to open search */
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

  async function handleSend(text?: string) {
    const finalPrompt = (text || prompt).trim();
    if (!finalPrompt || creating) return;

    // Check auth — save prompt and redirect if not logged in
    if (!isAuthenticated()) {
      savePendingPrompt(finalPrompt);
      navigate('/auth');
      return;
    }

    setCreating(true);
    try {
      const name = finalPrompt.slice(0, 50) || 'New Project';
      const project = await createProject({ name, description: finalPrompt });
      navigate(`/project/${project.id}`, { state: { initialPrompt: finalPrompt } });
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleNewProject(data: { name: string; description: string }) {
    try {
      const project = await createProject(data);
      navigate(`/project/${project.id}`, {
        state: data.description ? { initialPrompt: data.description } : undefined,
      });
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChipClick(chip: string) {
    setPrompt(chip);
    // Auto-submit after a brief delay so the user sees the chip fill in
    setTimeout(() => handleSend(chip), 100);
  }

  function handleAttachFile() {
    fileInputRef.current?.click();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setPrompt((prev) =>
        prev + (prev ? '\n' : '') + `[Attached: ${file.name}]\n\`\`\`\n${content.slice(0, 5000)}\n\`\`\``
      );
      textareaRef.current?.focus();
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleGithubClick() {
    setPrompt((prev) => prev + (prev ? ' ' : '') + 'Clone my GitHub repository and help me with ');
    textareaRef.current?.focus();
  }

  function handleShareClick() {
    setInviteOpen(true);
  }

  function handleFilesClick() {
    fileInputRef.current?.click();
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
      setPrompt((prev) => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.start();
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".txt,.js,.ts,.jsx,.tsx,.json,.css,.html,.py,.md,.csv,.xml,.yaml,.yml,.env,.sh"
      />

      {/* Modals */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NewProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={handleNewProject}
      />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Shared sidebar */}
      <Sidebar
        activePage="dashboard"
        onSearchClick={() => setSearchOpen(true)}
        onNewProject={() => setProjectModalOpen(true)}
        onInviteClick={() => setInviteOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* ── MAIN CONTENT ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 24px',
            gap: 16,
          }}
        >
          {/* Model selector */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 500,
              color: '#555',
              backgroundColor: '#fff',
              border: '1px solid #e0ddd8',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onClick={() => setSettingsOpen(true)}
          >
            <Sparkles size={14} color="#8b5cf6" />
            <span>Claude Opus</span>
            <ChevronDown size={12} />
          </button>

          {/* Notification bell */}
          <button
            onClick={() => navigate('/library')}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              padding: 4,
            }}
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 7,
                height: 7,
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                border: '1.5px solid #f5f3ef',
              }}
            />
          </button>

          {/* Credits */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              color: '#888',
              fontWeight: 500,
            }}
          >
            <Zap size={14} color="#f59e0b" />
            <span>250 credits</span>
          </div>

          {/* Avatar */}
          <div
            onClick={() => setSettingsOpen(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            U
          </div>
        </header>

        {/* Scrollable center area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px 60px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 680 }}>
            {/* Plan badge */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#888',
                  backgroundColor: '#fff',
                  border: '1px solid #e0ddd8',
                  padding: '4px 12px',
                  borderRadius: 999,
                }}
              >
                <Zap size={12} color="#f59e0b" />
                Free Plan
              </span>
            </div>

            {/* Heading */}
            <h1
              style={{
                fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
                fontSize: 42,
                fontWeight: 400,
                color: '#1a1a1a',
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 1.15,
              }}
            >
              What can I do for you?
            </h1>

            {/* Input card */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                border: '1px solid #e0ddd8',
                padding: '16px 20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                marginBottom: 20,
              }}
            >
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you'd like to build..."
                rows={3}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 15,
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
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #f0ede8',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button style={toolbarBtnStyle} title="Attach file" onClick={handleAttachFile}>
                    <Paperclip size={16} />
                  </button>
                  <button style={toolbarBtnStyle} title="GitHub" onClick={handleGithubClick}>
                    <Github size={16} />
                  </button>
                  <button style={toolbarBtnStyle} title="Share" onClick={handleShareClick}>
                    <Share2 size={16} />
                  </button>
                  <button style={toolbarBtnStyle} title="Files" onClick={handleFilesClick}>
                    <FolderOpen size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button style={toolbarBtnStyle} title="Emoji" onClick={() => setPrompt((p) => p + ' ')}>
                    <Smile size={16} />
                  </button>
                  <button style={toolbarBtnStyle} title="Voice" onClick={handleVoice}>
                    <Mic size={16} />
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!prompt.trim() || creating}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: prompt.trim() ? '#1a1a1a' : '#e0ddd8',
                      color: prompt.trim() ? '#fff' : '#aaa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: prompt.trim() ? 'pointer' : 'default',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Integrations bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: '1px solid #f0ede8',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 11, color: '#bbb', fontWeight: 500 }}>Integrations:</span>
                {[
                  { name: 'GitHub', action: () => handleGithubClick() },
                  { name: 'Vercel', action: () => setPrompt((p) => p + (p ? ' ' : '') + 'Deploy to Vercel ') },
                  { name: 'Supabase', action: () => setPrompt((p) => p + (p ? ' ' : '') + 'Use Supabase for ') },
                  { name: 'Stripe', action: () => setPrompt((p) => p + (p ? ' ' : '') + 'Add Stripe payments for ') },
                ].map((item) => (
                  <span
                    key={item.name}
                    onClick={() => {
                      item.action();
                      textareaRef.current?.focus();
                    }}
                    style={{
                      fontSize: 11,
                      color: '#888',
                      backgroundColor: '#f8f6f3',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #eae7e2',
                      cursor: 'pointer',
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick chips */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={creating}
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    color: '#666',
                    backgroundColor: '#fff',
                    border: '1px solid #e0ddd8',
                    borderRadius: 999,
                    cursor: creating ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s, color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#bbb';
                    e.currentTarget.style.color = '#1a1a1a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0ddd8';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Feature promo card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f8f6f3 0%, #f0ede8 100%)',
                borderRadius: 14,
                border: '1px solid #e0ddd8',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                  Upgrade to Pro
                </div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>
                  Get unlimited tasks, priority execution, and advanced integrations.
                </div>
              </div>
              <button
                onClick={() => navigate('/library')}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: '#1a1a1a',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#aaa',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s',
};
