import { useState, useRef, useEffect } from 'react';
import { X, FolderOpen, Plus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string }) => void;
}

const connectorOptions = [
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'vercel', label: 'Vercel', icon: '▲' },
  { id: 'supabase', label: 'Supabase', icon: '⚡' },
  { id: 'stripe', label: 'Stripe', icon: '💳' },
  { id: 'slack', label: 'Slack', icon: '💬' },
];

export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showConnectors, setShowConnectors] = useState(false);
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setInstructions('');
      setSelectedConnectors([]);
      setShowConnectors(false);
      setTimeout(() => nameRef.current?.focus(), 50);
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

  function handleCreate() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: instructions.trim() });
    onClose();
  }

  function toggleConnector(id: string) {
    setSelectedConnectors((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
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
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: 540,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 16px 60px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          animation: 'slideInModal 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 0',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
            Create project
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

        {/* Content */}
        <div style={{ padding: '24px 24px 20px' }}>
          {/* Folder icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: '#f8f6f3',
                border: '1px solid #e8e5e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderOpen size={28} color="#999" />
            </div>
          </div>

          {/* Project name */}
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            Project name
          </label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              color: '#1a1a1a',
              backgroundColor: '#faf9f7',
              border: '1px solid #e8e5e0',
              borderRadius: 10,
              outline: 'none',
              fontFamily: 'inherit',
              marginBottom: 20,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#bbb')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e8e5e0')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />

          {/* Instructions */}
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            Instructions{' '}
            <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder='e.g. "Focus on Python best practices", "Keep a professional tone" or "Always provide sources for important conclusions".'
            rows={5}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              color: '#1a1a1a',
              backgroundColor: '#faf9f7',
              border: '1px solid #e8e5e0',
              borderRadius: 10,
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none',
              lineHeight: 1.5,
              marginBottom: 20,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#bbb')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e8e5e0')}
          />

          {/* Connectors */}
          <div
            style={{
              border: '1px solid #e8e5e0',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setShowConnectors(!showConnectors)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 13, color: '#888' }}>
                Connectors{' '}
                <span style={{ color: '#bbb' }}>(optional)</span>
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#666',
                }}
              >
                <Plus size={14} />
                Add connectors
              </span>
            </button>

            {showConnectors && (
              <div
                style={{
                  padding: '8px 14px 14px',
                  borderTop: '1px solid #f0ede8',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {connectorOptions.map((c) => {
                  const isSelected = selectedConnectors.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleConnector(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        fontSize: 13,
                        fontWeight: 500,
                        color: isSelected ? '#1a1a1a' : '#888',
                        backgroundColor: isSelected ? '#f0ede8' : '#faf9f7',
                        border: isSelected ? '1px solid #d4d1cc' : '1px solid #e8e5e0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{c.icon}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '16px 24px',
            borderTop: '1px solid #f0ede8',
          }}
        >
          <button
            onClick={onClose}
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
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9f7')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              padding: '9px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: name.trim() ? '#e11d48' : '#fda4af',
              border: 'none',
              borderRadius: 10,
              cursor: name.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (name.trim()) e.currentTarget.style.backgroundColor = '#be123c';
            }}
            onMouseLeave={(e) => {
              if (name.trim()) e.currentTarget.style.backgroundColor = '#e11d48';
            }}
          >
            Create
          </button>
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
