import { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Heart,
  Zap,
  TrendingUp,
  Gift,
} from 'lucide-react';
import { useToastStore, type ToastItem } from '../stores/toast-store';

/* Inject toast animations once */
const toastAnimId = 'masidy-toast-anims';
if (typeof document !== 'undefined' && !document.getElementById(toastAnimId)) {
  const style = document.createElement('style');
  style.id = toastAnimId;
  style.textContent = `
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(40px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to { opacity: 0; transform: translateX(40px) scale(0.95); }
    }
    @keyframes toastProgressShrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
  document.head.appendChild(style);
}

const TOAST_CONFIG: Record<
  ToastItem['type'],
  { bg: string; border: string; accent: string; icon: typeof CheckCircle2 }
> = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', icon: CheckCircle2 },
  error: { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626', icon: AlertCircle },
  info: { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', icon: Info },
  warning: { bg: '#fffbeb', border: '#fde68a', accent: '#d97706', icon: AlertCircle },
  upgrade: { bg: 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 50%, #eef2ff 100%)', border: '#c4b5fd', accent: '#7c3aed', icon: Sparkles },
  friendly: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', icon: Heart },
  achievement: { bg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', border: '#fde047', accent: '#ca8a04', icon: Zap },
  suggestion: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#059669', icon: TrendingUp },
};

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  function handleDismiss() {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }

  const isGradientBg = config.bg.includes('gradient');

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        maxWidth: 380,
        minWidth: 320,
        animation: exiting
          ? 'toastSlideOut 0.3s ease-in forwards'
          : 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: `${config.accent}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={config.accent} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: 3,
              lineHeight: 1.3,
            }}
          >
            {toast.title}
          </div>
        )}
        <div
          style={{
            fontSize: 12,
            color: '#666',
            lineHeight: 1.5,
          }}
        >
          {toast.message}
        </div>
        {/* Action button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              handleDismiss();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: config.accent,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {toast.action.icon === 'gift' && <Gift size={12} />}
            {toast.action.icon === 'sparkles' && <Sparkles size={12} />}
            {toast.action.icon === 'zap' && <Zap size={12} />}
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#bbb',
          padding: 2,
          borderRadius: 6,
          display: 'flex',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>

      {/* Auto-dismiss progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: `${config.accent}20`,
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: config.accent,
              borderRadius: 2,
              animation: `toastProgressShrink ${toast.duration}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <SingleToast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}
