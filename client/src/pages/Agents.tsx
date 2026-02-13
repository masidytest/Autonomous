import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { SearchModal } from '../components/SearchModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { InviteModal } from '../components/InviteModal';
import { SettingsModal } from '../components/SettingsModal';
import {
  Send,
  Monitor,
  Settings2,
  MessageCircle,
  BadgeCheck,
  CreditCard,
} from 'lucide-react';

/* ── Feature cards data ── */
const features = [
  {
    icon: CreditCard,
    title: 'Unique AI Identity',
    description: 'Assign a name and personality. Remembers everything.',
  },
  {
    icon: Monitor,
    title: 'Persistent Memory & Computer',
    description: 'Give your assistant specialized knowledge in specific areas.',
  },
  {
    icon: Settings2,
    title: 'Custom Abilities',
    description: 'Cloud assistant 24/7 that preserves all context and memory.',
  },
  {
    icon: MessageCircle,
    title: 'Works in Your Messaging App',
    description: 'Available on Telegram. More messaging apps coming soon.',
  },
];

/* ── Floating app icons for the illustration ── */
const floatingApps = [
  { name: 'Slack', color: '#4A154B', x: 22, y: 8, size: 52, icon: 'S' },
  { name: 'Discord', color: '#5865F2', x: 48, y: 4, size: 52, icon: 'D' },
  { name: 'Telegram', color: '#0088cc', x: 10, y: 32, size: 56, icon: 'T' },
  { name: 'WhatsApp', color: '#25D366', x: 72, y: 30, size: 52, icon: 'W' },
  { name: 'Teams', color: '#6264A7', x: 82, y: 10, size: 48, icon: 'M' },
];

export function Agents() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

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

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f5f3ef',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Modals */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NewProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={(data) => console.log('Create project:', data)}
      />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Shared sidebar */}
      <Sidebar
        activePage="agents"
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
        {/* Page header */}
        <header
          style={{
            padding: '20px 32px 0',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>Agents</h1>
        </header>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 32px 60px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 960 }}>
            {/* ── Hero illustration ── */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              {/* Floating app icons */}
              {floatingApps.map((app) => (
                <div
                  key={app.name}
                  style={{
                    position: 'absolute',
                    left: `${app.x}%`,
                    top: `${app.y}%`,
                    width: app.size,
                    height: app.size,
                    borderRadius: '50%',
                    backgroundColor: app.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    zIndex: 2,
                  }}
                >
                  {app.icon}
                </div>
              ))}

              {/* Center phone / chat mockup */}
              <div
                style={{
                  position: 'relative',
                  width: 200,
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                  padding: '24px 20px',
                  zIndex: 3,
                }}
              >
                {/* Top bar of mock */}
                <div
                  style={{
                    width: '60%',
                    height: 6,
                    backgroundColor: '#f0ede8',
                    borderRadius: 3,
                    marginBottom: 16,
                  }}
                />
                {/* Agent identity card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                    Masidy
                  </span>
                  <BadgeCheck size={16} color="#3b82f6" />
                </div>
                {/* Placeholder lines */}
                <div style={{ height: 6, backgroundColor: '#f0ede8', borderRadius: 3, marginBottom: 8, width: '100%' }} />
                <div style={{ height: 6, backgroundColor: '#f0ede8', borderRadius: 3, marginBottom: 8, width: '75%' }} />
                <div style={{ height: 6, backgroundColor: '#f0ede8', borderRadius: 3, width: '50%' }} />
              </div>
            </div>

            {/* ── Heading ── */}
            <h2
              style={{
                fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
                fontSize: 32,
                fontWeight: 400,
                color: '#1a1a1a',
                textAlign: 'center',
                marginBottom: 40,
                lineHeight: 1.2,
              }}
            >
              Request your personal agent
            </h2>

            {/* ── Feature cards grid ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                marginBottom: 48,
              }}
            >
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 14,
                      border: '1px solid #e8e5e0',
                      padding: '24px 20px',
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                      e.currentTarget.style.borderColor = '#d4d1cc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e8e5e0';
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: '#f8f6f3',
                        border: '1px solid #eae7e2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={20} color="#666" />
                    </div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#1a1a1a',
                        marginBottom: 8,
                        lineHeight: 1.3,
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: '#888',
                        lineHeight: 1.5,
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── CTA button ── */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 28px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: '#1a1a1a',
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.15s, box-shadow 0.15s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
                }}
              >
                <Send size={16} />
                Get Started with Agents
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
