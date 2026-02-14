import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Plus,
  Code2,
  MessageSquare,
} from 'lucide-react';
import { fetchProjects, fetchAllTasks, type ProjectData, type TaskData } from '../lib/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
      // Load real data
      fetchProjects().then((p) => setProjects(p.slice(0, 10))).catch(() => {});
      fetchAllTasks().then((t) => setTasks(t.slice(0, 10))).catch(() => {});
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

  const q = query.toLowerCase();
  const filteredProjects = projects.filter(
    (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q),
  );
  const filteredTasks = tasks.filter(
    (t) => t.prompt.toLowerCase().includes(q),
  );

  function handleNavigate(projectId: string) {
    onClose();
    navigate(`/project/${projectId}`);
  }

  function handleNewTask() {
    onClose();
    navigate('/dashboard');
  }

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
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 620,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 16px 60px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '65vh',
          overflow: 'hidden',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          animation: 'slideInModal 0.2s ease-out',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid #f0ede8',
          }}
        >
          <Search size={20} color="#bbb" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and tasks..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 16,
              color: '#1a1a1a',
              fontFamily: 'inherit',
              backgroundColor: 'transparent',
            }}
          />
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
            <X size={18} />
          </button>
        </div>

        {/* Scrollable results */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {/* New task shortcut */}
          <button
            onClick={handleNewTask}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9f7')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Plus size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
              New task
            </span>
          </button>

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <>
              <div style={{ padding: '10px 20px 6px', fontSize: 12, fontWeight: 500, color: '#aaa' }}>
                Projects
              </div>
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleNavigate(project.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9f7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: '#f8f6f3', border: '1px solid #eae7e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Code2 size={16} color="#888" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.name}
                    </div>
                    {project.description && (
                      <p style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {project.description}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#bbb', flexShrink: 0 }}>
                    {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <>
              <div style={{ padding: '10px 20px 6px', fontSize: 12, fontWeight: 500, color: '#aaa' }}>
                Tasks
              </div>
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleNavigate(task.projectId)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9f7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: '#f8f6f3', border: '1px solid #eae7e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MessageSquare size={16} color="#888" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.prompt.slice(0, 80)}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      {task.status === 'completed' ? 'Completed' : task.status === 'running' ? 'Running' : 'Pending'}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* No results */}
          {filteredProjects.length === 0 && filteredTasks.length === 0 && query && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#999', fontSize: 14 }}>
              No results found for "{query}"
            </div>
          )}

          {/* Empty state when no data */}
          {projects.length === 0 && tasks.length === 0 && !query && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#999', fontSize: 14 }}>
              No projects yet. Create your first task to get started.
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #f0ede8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={kbdGroupStyle}>
              <kbd style={kbdStyle}>&#8593;</kbd>
              <kbd style={kbdStyle}>&#8595;</kbd>
              <span style={{ fontSize: 11, color: '#bbb' }}>navigate</span>
            </span>
            <span style={kbdGroupStyle}>
              <kbd style={kbdStyle}>&#8629;</kbd>
              <span style={{ fontSize: 11, color: '#bbb' }}>open</span>
            </span>
          </div>
          <span style={kbdGroupStyle}>
            <kbd style={kbdStyle}>esc</kbd>
            <span style={{ fontSize: 11, color: '#bbb' }}>close</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInModal {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 20,
  height: 20,
  padding: '0 5px',
  fontSize: 11,
  fontWeight: 500,
  color: '#aaa',
  backgroundColor: '#f8f6f3',
  border: '1px solid #e8e5e0',
  borderRadius: 4,
  fontFamily: 'inherit',
};

const kbdGroupStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};
