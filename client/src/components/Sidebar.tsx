import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Bot,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  Grid3X3,
  Smartphone,
  Gift,
  ArrowRight,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';

const sidebarProjects = [
  { id: '1', name: 'masidy-web', emoji: '🌐' },
  { id: '2', name: 'api-service', emoji: '⚡' },
  { id: '3', name: 'mobile-app', emoji: '📱' },
];

const recentTasks = [
  { id: '1', title: 'Build landing page with hero section', time: '2 hours ago', icon: Pencil },
  { id: '2', title: 'Can you build a full-stack app...', time: '5 hours ago', icon: Bot },
  { id: '3', title: 'How to Create an App Like...', time: 'Yesterday', icon: Settings },
];

interface SidebarProps {
  activePage?: 'dashboard' | 'agents' | 'search' | 'library';
  onSearchClick?: () => void;
  onNewProject?: () => void;
  onInviteClick?: () => void;
  onSettingsClick?: () => void;
}

export function Sidebar({ activePage = 'dashboard', onSearchClick, onNewProject, onInviteClick, onSettingsClick }: SidebarProps) {
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 64 : 280;

  const navItems = [
    { icon: Pencil, label: 'New task', route: '/dashboard', id: 'dashboard' as const, isButton: true },
    { icon: Bot, label: 'Agents', route: '/agents', id: 'agents' as const, badge: 'New' },
    { icon: Search, label: 'Search', route: '/dashboard', id: 'search' as const },
    { icon: BookOpen, label: 'Library', route: '/dashboard', id: 'library' as const },
  ];

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        backgroundColor: '#faf9f7',
        borderRight: '1px solid #e8e5e0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo + toggle */}
      <div
        style={{
          padding: collapsed ? '16px 12px' : '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: '#1a1a1a',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {!collapsed && (
            <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              masidy
            </span>
          )}
        </a>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: '#999',
              display: 'flex',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              position: 'absolute',
              left: sidebarWidth + 8,
              top: 20,
              background: '#fff',
              border: '1px solid #e8e5e0',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 6,
              color: '#999',
              display: 'flex',
              zIndex: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* New Task button */}
      <div style={{ padding: collapsed ? '8px 10px' : '8px 16px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            padding: collapsed ? '10px' : '10px 14px',
            fontSize: 14,
            fontWeight: 500,
            color: '#1a1a1a',
            backgroundColor: '#fff',
            border: '1px solid #e0ddd8',
            borderRadius: 10,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f6f3')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          <Pencil size={16} />
          {!collapsed && <span>New task</span>}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ padding: collapsed ? '8px 10px' : '8px 16px' }}>
        {[
          { icon: Bot, label: 'Agents', route: '/agents', id: 'agents' as const, badge: 'New' },
          { icon: Search, label: 'Search', route: '/dashboard', id: 'search' as const },
          { icon: BookOpen, label: 'Library', route: '/library', id: 'library' as const },
        ].map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.id === 'search' && onSearchClick) {
                  onSearchClick();
                } else {
                  navigate(item.route);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 10,
                padding: collapsed ? '8px' : '8px 10px',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#1a1a1a' : '#666',
                backgroundColor: isActive ? '#f0ede8' : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s, color 0.15s',
                marginBottom: 2,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f0ede8';
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
              <item.icon size={16} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#0066ff',
                        backgroundColor: '#e8f0ff',
                        padding: '2px 7px',
                        borderRadius: 999,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ margin: '4px 16px', height: 1, backgroundColor: '#e8e5e0' }} />

      {/* Projects section */}
      {!collapsed && (
        <div style={{ padding: '12px 16px 4px' }}>
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              padding: '4px 0',
              fontFamily: 'inherit',
            }}
          >
            {projectsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span style={{ flex: 1, textAlign: 'left' }}>Projects</span>
            <Plus
              size={12}
              style={{ opacity: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                onNewProject?.();
              }}
            />
          </button>
          {projectsOpen && (
            <div style={{ marginTop: 4 }}>
              <button
                onClick={() => onNewProject?.()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  fontSize: 13,
                  color: '#888',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0ede8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Plus size={14} />
                <span>New project</span>
              </button>
              {sidebarProjects.map((proj) => (
                <button
                  key={proj.id}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    fontSize: 13,
                    color: '#555',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0ede8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontSize: 14 }}>{proj.emoji}</span>
                  <span>{proj.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {!collapsed && <div style={{ margin: '4px 16px', height: 1, backgroundColor: '#e8e5e0' }} />}

      {/* All tasks / history */}
      {!collapsed && (
        <div style={{ padding: '8px 16px 4px', flex: 1, overflow: 'auto' }}>
          <button
            onClick={() => setTasksOpen(!tasksOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              padding: '4px 0',
              fontFamily: 'inherit',
            }}
          >
            {tasksOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span style={{ flex: 1, textAlign: 'left' }}>All tasks</span>
            <SlidersHorizontal size={12} style={{ opacity: 0.5 }} />
          </button>
          {tasksOpen && (
            <div style={{ marginTop: 4 }}>
              {recentTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <button
                    key={task.id}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 8px',
                      fontSize: 13,
                      color: '#555',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0ede8')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Icon size={14} color="#bbb" />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        textAlign: 'left',
                      }}
                    >
                      {task.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Referral / share banner */}
      {!collapsed && (
        <div
          onClick={() => onInviteClick?.()}
          style={{
            margin: '8px 16px',
            padding: '12px 14px',
            backgroundColor: '#f0ede8',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e5e0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0ede8')}
        >
          <Gift size={18} color="#888" />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#444',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Share Masidy with a friend
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>Get 500 credits each</div>
          </div>
          <ArrowRight size={14} color="#999" />
        </div>
      )}

      {/* Bottom bar */}
      <div
        style={{
          padding: collapsed ? '12px 10px' : '12px 16px',
          borderTop: '1px solid #e8e5e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 8,
        }}
      >
        <button style={bottomIconStyle} onClick={() => onSettingsClick?.()}>
          <Settings size={16} />
        </button>
        {!collapsed && (
          <>
            <button style={bottomIconStyle}>
              <Grid3X3 size={16} />
            </button>
            <button style={bottomIconStyle}>
              <Smartphone size={16} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

const bottomIconStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#999',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
