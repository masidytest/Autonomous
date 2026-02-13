import { useState, useEffect } from 'react';
import {
  X,
  User,
  Settings,
  Sparkles,
  CalendarClock,
  Mail,
  ShieldCheck,
  Globe,
  Paintbrush,
  Wrench,
  Plug,
  Blocks,
  HelpCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'usage', label: 'Usage', icon: Sparkles },
  { id: 'scheduled', label: 'Scheduled Tasks', icon: CalendarClock },
  { id: 'mail', label: 'Mail Masidy', icon: Mail },
  { id: 'data', label: 'Data Controls', icon: ShieldCheck },
  { id: 'browser', label: 'Browser Cloud', icon: Globe },
  { id: 'personalization', label: 'Personalization', icon: Paintbrush },
  { id: 'skill', label: 'Skill', icon: Wrench },
  { id: 'connectors', label: 'Connectors', icon: Plug },
  { id: 'integrations', label: 'Integrations', icon: Blocks },
];

type ThemeOption = 'light' | 'dark' | 'system';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('settings');
  const [language, setLanguage] = useState('english');
  const [theme, setTheme] = useState<ThemeOption>('system');
  const [exclusiveContent, setExclusiveContent] = useState(true);
  const [emailOnQueue, setEmailOnQueue] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('settings');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themeOptions: { id: ThemeOption; label: string; lines: string[] }[] = [
    { id: 'light', label: 'Light', lines: ['#e8e5e0', '#d4d1cc', '#e8e5e0'] },
    { id: 'dark', label: 'Dark', lines: ['#555', '#444', '#555'] },
    { id: 'system', label: 'Follow system', lines: ['#e8e5e0', '#444', '#e8e5e0'] },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.25)',
          zIndex: 999,
          animation: 'fadeInBackdrop 0.15s ease-out',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: 820,
          height: '85vh',
          maxHeight: 640,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 16px 60px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
          zIndex: 1000,
          display: 'flex',
          overflow: 'hidden',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          animation: 'slideInModal 0.2s ease-out',
        }}
      >
        {/* ── Left nav ── */}
        <div
          style={{
            width: 240,
            minWidth: 240,
            borderRight: '1px solid #f0ede8',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 0',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 20px 20px',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                backgroundColor: '#1a1a1a',
                borderRadius: 8,
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
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>masidy</span>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '0 8px', overflow: 'auto' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#1a1a1a' : '#666',
                    backgroundColor: isActive ? '#f0ede8' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: 2,
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f8f6f3';
                      e.currentTarget.style.color = '#1a1a1a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#666';
                    }
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Get help */}
          <div style={{ padding: '12px 20px 0', borderTop: '1px solid #f0ede8' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#888',
                fontFamily: 'inherit',
                padding: '6px 0',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
            >
              <HelpCircle size={16} />
              <span>Get help</span>
              <ExternalLink size={12} style={{ marginLeft: 2 }} />
            </button>
          </div>
        </div>

        {/* ── Right content ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 28px 0',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
              {navItems.find((n) => n.id === activeTab)?.label || 'Settings'}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#bbb',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#bbb')}
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '28px 28px 32px' }}>
            {activeTab === 'settings' && (
              <>
                {/* ── General ── */}
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#999',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 16,
                    }}
                  >
                    General
                  </div>

                  {/* Language */}
                  <div style={{ marginBottom: 24 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#1a1a1a',
                        marginBottom: 8,
                      }}
                    >
                      Language
                    </label>
                    <div style={{ position: 'relative', width: 220 }}>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 14px',
                          fontSize: 14,
                          color: '#1a1a1a',
                          backgroundColor: '#faf9f7',
                          border: '1px solid #e8e5e0',
                          borderRadius: 10,
                          outline: 'none',
                          fontFamily: 'inherit',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="english">English</option>
                        <option value="italian">Italiano</option>
                        <option value="spanish">Espa&#241;ol</option>
                        <option value="french">Fran&#231;ais</option>
                        <option value="german">Deutsch</option>
                        <option value="arabic">&#x627;&#x644;&#x639;&#x631;&#x628;&#x64A;&#x629;</option>
                        <option value="chinese">&#x4E2D;&#x6587;</option>
                        <option value="japanese">&#x65E5;&#x672C;&#x8A9E;</option>
                      </select>
                      <ChevronDown
                        size={14}
                        color="#999"
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Appearance ── */}
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#999',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 16,
                    }}
                  >
                    Appearance
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    {themeOptions.map((opt) => {
                      const isSelected = theme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setTheme(opt.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontFamily: 'inherit',
                          }}
                        >
                          {/* Preview thumbnail */}
                          <div
                            style={{
                              width: 120,
                              height: 80,
                              borderRadius: 10,
                              border: isSelected ? '2px solid #3b82f6' : '2px solid #e8e5e0',
                              backgroundColor: opt.id === 'dark' ? '#1a1a1a' : '#fff',
                              padding: '14px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              gap: 6,
                              transition: 'border-color 0.15s',
                            }}
                          >
                            {/* Simulated layout lines */}
                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                                height: '100%',
                              }}
                            >
                              {/* Left mini sidebar */}
                              <div
                                style={{
                                  width: 24,
                                  backgroundColor: opt.id === 'dark' ? '#333' : '#f0ede8',
                                  borderRadius: 3,
                                }}
                              />
                              {/* Right content area */}
                              <div
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4,
                                }}
                              >
                                {opt.lines.map((color, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      height: 5,
                                      backgroundColor: color,
                                      borderRadius: 2,
                                      width: i === 1 ? '70%' : '100%',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isSelected ? 500 : 400,
                              color: isSelected ? '#1a1a1a' : '#888',
                            }}
                          >
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#f0ede8', margin: '8px 0 28px' }} />

                {/* ── Communication Preferences ── */}
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#999',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 20,
                    }}
                  >
                    Communication Preferences
                  </div>

                  {/* Toggle: Exclusive content */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 24,
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>
                        Receive exclusive content
                      </div>
                      <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
                        Get exclusive offers, event updates, excellent case studies and guides for new features.
                      </div>
                    </div>
                    <button
                      onClick={() => setExclusiveContent(!exclusiveContent)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        border: 'none',
                        backgroundColor: exclusiveContent ? '#3b82f6' : '#d4d1cc',
                        cursor: 'pointer',
                        position: 'relative',
                        flexShrink: 0,
                        transition: 'background-color 0.2s',
                        marginTop: 2,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          position: 'absolute',
                          top: 3,
                          left: exclusiveContent ? 23 : 3,
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      />
                    </button>
                  </div>

                  {/* Toggle: Email on queue */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 24,
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>
                        Email me when my queued task starts
                      </div>
                      <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
                        When enabled, we&apos;ll send you a timely email once your task has left the queue and started processing.
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailOnQueue(!emailOnQueue)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        border: 'none',
                        backgroundColor: emailOnQueue ? '#3b82f6' : '#d4d1cc',
                        cursor: 'pointer',
                        position: 'relative',
                        flexShrink: 0,
                        transition: 'background-color 0.2s',
                        marginTop: 2,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          position: 'absolute',
                          top: 3,
                          left: emailOnQueue ? 23 : 3,
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#f0ede8', margin: '8px 0 20px' }} />

                {/* Manage Cookies */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#888' }}>Manage Cookies</span>
                  <button
                    style={{
                      padding: '7px 18px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#555',
                      backgroundColor: '#fff',
                      border: '1px solid #e0ddd8',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9f7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    Manage
                  </button>
                </div>
              </>
            )}

            {/* ── Account tab ── */}
            {activeTab === 'account' && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 20,
                  }}
                >
                  Profile
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 28,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 20,
                      fontWeight: 600,
                    }}
                  >
                    U
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>User</div>
                    <div style={{ fontSize: 13, color: '#999' }}>user@example.com</div>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: '#f0ede8', margin: '0 0 24px' }} />

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    style={{
                      padding: '9px 20px',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#555',
                      backgroundColor: '#fff',
                      border: '1px solid #e0ddd8',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Edit profile
                  </button>
                  <button
                    style={{
                      padding: '9px 20px',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#dc2626',
                      backgroundColor: '#fff',
                      border: '1px solid #fecaca',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {/* ── Usage tab ── */}
            {activeTab === 'usage' && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 20,
                  }}
                >
                  Current Plan
                </div>
                <div
                  style={{
                    padding: '20px 24px',
                    border: '1px solid #e8e5e0',
                    borderRadius: 12,
                    backgroundColor: '#faf9f7',
                    marginBottom: 24,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                    Free Plan
                  </div>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
                    250 credits remaining
                  </div>
                  <div
                    style={{
                      height: 6,
                      backgroundColor: '#e8e5e0',
                      borderRadius: 3,
                      overflow: 'hidden',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: '25%',
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <button
                    style={{
                      padding: '9px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: '#1a1a1a',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            )}

            {/* ── Placeholder for other tabs ── */}
            {!['settings', 'account', 'usage'].includes(activeTab) && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 300,
                  color: '#ccc',
                }}
              >
                <Settings size={40} strokeWidth={1.2} />
                <div style={{ fontSize: 14, marginTop: 12, color: '#bbb' }}>
                  {navItems.find((n) => n.id === activeTab)?.label} settings coming soon
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInModal {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
