import { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Plus,
  Pencil,
  Bot,
  MessageCircle,
  CheckCircle2,
  Settings,
} from 'lucide-react';

/* ── Mock task data ── */
const recentTasks = [
  {
    id: '1',
    title: 'Correcting Typographical Errors in Text',
    preview: '## Unified AI Platform - Completed and Working. Fixed the routing bug that prevented the v',
    date: 'Wednesday',
    icon: Pencil,
    iconColor: '#22c55e',
    badge: null,
  },
  {
    id: '2',
    title: 'Can you build a full-stack app like v0 and Manus?',
    preview: 'You\'re right. The truth is: - I can **generate UI** and **structures** - But I can\'t cre',
    date: '',
    icon: Bot,
    iconColor: '#f59e0b',
    badge: '2/6',
  },
];

const olderTasks = [
  {
    id: '3',
    title: 'How to Create an App Like OnlyFans Store',
    preview: 'Successfully created **FanStore**, a complete mobile marketplace inspired by OnlyFans Store. L',
    date: '1/31',
    icon: MessageCircle,
    iconColor: '#888',
    badge: null,
  },
  {
    id: '4',
    title: 'Build REST API with Authentication',
    preview: 'Created a fully functional REST API with JWT authentication, user registration, and protected routes.',
    date: '1/28',
    icon: Settings,
    iconColor: '#888',
    badge: null,
  },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* Filter tasks by query */
  const q = query.toLowerCase();
  const filteredRecent = recentTasks.filter(
    (t) => t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q),
  );
  const filteredOlder = olderTasks.filter(
    (t) => t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q),
  );

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
            placeholder="Search tasks..."
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

          {/* Last 7 days */}
          {filteredRecent.length > 0 && (
            <>
              <div
                style={{
                  padding: '10px 20px 6px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#aaa',
                }}
              >
                Last 7 days
              </div>
              {filteredRecent.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </>
          )}

          {/* Last 30 days */}
          {filteredOlder.length > 0 && (
            <>
              <div
                style={{
                  padding: '10px 20px 6px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#aaa',
                }}
              >
                Last 30 days
              </div>
              {filteredOlder.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </>
          )}

          {/* No results */}
          {filteredRecent.length === 0 && filteredOlder.length === 0 && query && (
            <div
              style={{
                padding: '32px 20px',
                textAlign: 'center',
                color: '#999',
                fontSize: 14,
              }}
            >
              No tasks found for "{query}"
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

      {/* Animations */}
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

/* ── Task row component ── */
function TaskRow({
  task,
}: {
  task: {
    id: string;
    title: string;
    preview: string;
    date: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
    iconColor: string;
    badge: string | null;
  };
}) {
  const Icon = task.icon;
  return (
    <button
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
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
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: '#f8f6f3',
          border: '1px solid #eae7e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Icon size={16} color={task.iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#1a1a1a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {task.badge && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#888',
                  backgroundColor: '#f0ede8',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                {task.badge}
              </span>
            )}
            {task.date && (
              <span style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>
                {task.date}
              </span>
            )}
          </div>
        </div>
        <p
          style={{
            fontSize: 12,
            color: '#999',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.preview}
        </p>
      </div>
    </button>
  );
}

/* ── Keyboard hint styles ── */
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
