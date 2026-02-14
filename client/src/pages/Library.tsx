import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { SearchModal } from '../components/SearchModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { InviteModal } from '../components/InviteModal';
import { SettingsModal } from '../components/SettingsModal';
import { createProject, fetchProjects, fetchAllTasks, type ProjectData, type TaskData } from '../lib/api';
import { toast } from '../stores/toast-store';
import {
  SlidersHorizontal,
  Star,
  Search,
  LayoutGrid,
  List,
  Globe,
  MoreHorizontal,
  ChevronDown,
  Code2,
} from 'lucide-react';

/* ── Color palettes for project cards ── */
const colorPalettes = [
  ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
  ['#0d1117', '#161b22', '#21262d', '#30363d', '#484f58'],
  ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5'],
  ['#064e3b', '#065f46', '#047857', '#059669', '#10b981'],
  ['#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'],
  ['#1e3a5f', '#245071', '#2a6683', '#307c95', '#3692a7'],
];

export function Library() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [fileSearch, setFileSearch] = useState('');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => toast('Failed to load projects', 'error'));
    fetchAllTasks().then(setTasks).catch(() => {});
  }, []);

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

  // Build library items from real projects + tasks
  const libraryItems = projects.map((proj, idx) => {
    const projectTasks = tasks.filter((t) => t.projectId === proj.id);
    const latestTask = projectTasks[0];
    return {
      id: proj.id,
      title: latestTask?.prompt?.slice(0, 80) || proj.description || proj.name,
      date: new Date(proj.updatedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      badge: projectTasks.length > 1 ? `${projectTasks.length} tasks` : null,
      projectName: proj.name,
      previewColors: colorPalettes[idx % colorPalettes.length],
    };
  });

  const filtered = libraryItems.filter((item) =>
    item.title.toLowerCase().includes(fileSearch.toLowerCase()) ||
    item.projectName.toLowerCase().includes(fileSearch.toLowerCase()),
  );

  return (
    <div
      className="page-with-sidebar"
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
        onCreate={async (data) => {
          try {
            const project = await createProject(data);
            navigate(`/project/${project.id}`, {
              state: data.description ? { initialPrompt: data.description } : undefined,
            });
          } catch (err) {
            toast('Failed to create project. Please try again.', 'error');
          }
        }}
      />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Mobile navigation */}
      <MobileNav
        activePage="library"
        onSearchClick={() => setSearchOpen(true)}
        onNewProject={() => setProjectModalOpen(true)}
        onInviteClick={() => setInviteOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ display: 'flex' }}>
        <Sidebar
          activePage="library"
          onSearchClick={() => setSearchOpen(true)}
          onNewProject={() => setProjectModalOpen(true)}
          onInviteClick={() => setInviteOpen(true)}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>

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
        <header style={{ padding: '20px 32px 0' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 20 }}>
            Library
          </h1>

          {/* Filter bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            {/* Left filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: filter === 'all' ? '#1a1a1a' : '#888',
                  backgroundColor: filter === 'all' ? '#fff' : 'transparent',
                  border: filter === 'all' ? '1px solid #e0ddd8' : '1px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                <SlidersHorizontal size={14} />
                All
                <ChevronDown size={12} />
              </button>
              <button
                onClick={() => setFilter('favorites')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: filter === 'favorites' ? '#1a1a1a' : '#888',
                  backgroundColor: filter === 'favorites' ? '#fff' : 'transparent',
                  border: filter === 'favorites' ? '1px solid #e0ddd8' : '1px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                <Star size={14} />
                My favorites
              </button>
            </div>

            {/* Right: search + view toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Search input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  backgroundColor: '#fff',
                  border: '1px solid #e0ddd8',
                  borderRadius: 8,
                  minWidth: 180,
                }}
              >
                <Search size={14} color="#bbb" />
                <input
                  type="text"
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Search files"
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: '#1a1a1a',
                    fontFamily: 'inherit',
                    backgroundColor: 'transparent',
                    width: '100%',
                  }}
                />
              </div>

              {/* View toggle */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#f0ede8',
                  borderRadius: 6,
                  padding: 2,
                }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '5px 8px',
                    border: 'none',
                    borderRadius: 4,
                    backgroundColor: viewMode === 'grid' ? '#fff' : 'transparent',
                    color: viewMode === 'grid' ? '#1a1a1a' : '#999',
                    cursor: 'pointer',
                    display: 'flex',
                    boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '5px 8px',
                    border: 'none',
                    borderRadius: 4,
                    backgroundColor: viewMode === 'list' ? '#fff' : 'transparent',
                    color: viewMode === 'list' ? '#1a1a1a' : '#999',
                    cursor: 'pointer',
                    display: 'flex',
                    boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 40px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '50%',
                color: '#999',
              }}
            >
              <Search size={32} color="#ddd" />
              <p style={{ fontSize: 14, marginTop: 12 }}>No results for "{fileSearch}"</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {filtered.map((item) => (
                <div key={item.id}>
                  {/* Task header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>
                      {item.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 12,
                            color: '#888',
                            backgroundColor: '#f0ede8',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: '#bbb' }}>{item.date}</span>
                    </div>
                  </div>

                  {/* Project card with preview */}
                  <div
                    onClick={() => navigate(`/project/${item.id}`)}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      border: '1px solid #e8e5e0',
                      overflow: 'hidden',
                      maxWidth: 420,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s, border-color 0.2s',
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
                    {/* Project name bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            backgroundColor: '#e8f5e9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                          }}
                        >
                          <Globe size={15} color="#4caf50" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                          {item.projectName}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete project "${item.projectName}"? This cannot be undone.`)) {
                            // TODO: implement delete API
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ccc',
                          padding: 2,
                          borderRadius: 4,
                          display: 'flex',
                        }}
                        title="Options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    {/* Preview screenshot placeholder */}
                    <div
                      style={{
                        height: 200,
                        background: `linear-gradient(135deg, ${item.previewColors[0]} 0%, ${item.previewColors[1]} 25%, ${item.previewColors[2]} 50%, ${item.previewColors[3]} 75%, ${item.previewColors[4]} 100%)`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Fake UI skeleton on the preview */}
                      <div style={{ position: 'absolute', inset: 12, opacity: 0.15 }}>
                        {/* Top bar */}
                        <div
                          style={{
                            height: 8,
                            width: '40%',
                            backgroundColor: '#fff',
                            borderRadius: 4,
                            marginBottom: 16,
                          }}
                        />
                        {/* Title */}
                        <div
                          style={{
                            height: 12,
                            width: '70%',
                            backgroundColor: '#fff',
                            borderRadius: 4,
                            marginBottom: 8,
                          }}
                        />
                        <div
                          style={{
                            height: 6,
                            width: '90%',
                            backgroundColor: '#fff',
                            borderRadius: 3,
                            marginBottom: 6,
                          }}
                        />
                        <div
                          style={{
                            height: 6,
                            width: '60%',
                            backgroundColor: '#fff',
                            borderRadius: 3,
                            marginBottom: 20,
                          }}
                        />
                        {/* Cards row */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              style={{
                                flex: 1,
                                height: 50,
                                backgroundColor: '#fff',
                                borderRadius: 6,
                              }}
                            />
                          ))}
                        </div>
                        {/* Bottom row */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          {[1, 2, 3].map((n) => (
                            <div
                              key={n}
                              style={{
                                flex: 1,
                                height: 30,
                                backgroundColor: '#fff',
                                borderRadius: 4,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/project/${item.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderBottom: '1px solid #f0ede8',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9f7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Preview thumbnail */}
                  <div
                    style={{
                      width: 56,
                      height: 40,
                      borderRadius: 6,
                      background: `linear-gradient(135deg, ${item.previewColors[0]}, ${item.previewColors[4]})`,
                      flexShrink: 0,
                    }}
                  />
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#1a1a1a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#999',
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Globe size={11} />
                      {item.projectName}
                    </div>
                  </div>
                  {/* Right side */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#888',
                          backgroundColor: '#f0ede8',
                          padding: '2px 7px',
                          borderRadius: 4,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#bbb', minWidth: 70, textAlign: 'right' }}>
                      {item.date}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project/${item.id}`);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 0, display: 'flex' }}
                      title="Open project"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
