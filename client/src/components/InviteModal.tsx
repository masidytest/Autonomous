import { useState, useEffect, useRef } from 'react';
import { X, Copy, Send, Check } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getInviteLink() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://masidy-agent.vercel.app';
  return `${origin}/auth?ref=invite`;
}

const socialButtons = [
  { id: 'facebook', label: 'Facebook', icon: 'f', color: '#1877F2', bg: '#f0f5ff', urlFn: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { id: 'x', label: 'X', icon: '𝕏', color: '#1a1a1a', bg: '#f5f5f5', urlFn: (link: string) => `https://x.com/intent/tweet?text=${encodeURIComponent('Check out Masidy Agent — an AI software engineer!')}&url=${encodeURIComponent(link)}` },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in', color: '#0A66C2', bg: '#f0f5ff', urlFn: (link: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}` },
  { id: 'reddit', label: 'Reddit', icon: 'r', color: '#FF4500', bg: '#fff5f0', urlFn: (link: string) => `https://www.reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent('Masidy Agent — AI Software Engineer')}` },
];

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'redeem' | 'history'>('redeem');
  const emailRef = useRef<HTMLInputElement>(null);

  const inviteLink = getInviteLink();

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setCopied(false);
      setSent(false);
      setActiveTab('redeem');
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

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendEmail() {
    if (!email.trim()) return;
    const subject = encodeURIComponent('Join me on Masidy Agent');
    const body = encodeURIComponent(`Hey! Check out Masidy Agent — an AI-powered software engineer that builds full apps from a single prompt.\n\nJoin here: ${inviteLink}`);
    window.open(`mailto:${email.trim()}?subject=${subject}&body=${body}`);
    setSent(true);
    setEmail('');
    setTimeout(() => setSent(false), 2000);
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
          maxWidth: 480,
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
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#bbb',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            zIndex: 1,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#bbb')}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
          {/* Heart handshake icon */}
          <div style={{ marginBottom: 20 }}>
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto' }}
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
              <path d="m18 15-2-2" />
              <path d="m15 18-2-2" />
            </svg>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            Invite to get credits
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#888',
              marginBottom: 28,
              lineHeight: 1.5,
            }}
          >
            Share your invite link with friends, get 500 credits each.
          </p>

          {/* Share invite link */}
          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#1a1a1a',
                marginBottom: 8,
              }}
            >
              Share invite link
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                border: '1px solid #e8e5e0',
                borderRadius: 10,
                overflow: 'hidden',
                backgroundColor: '#faf9f7',
              }}
            >
              <input
                type="text"
                readOnly
                value={inviteLink}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#888',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: copied ? '#16a34a' : '#555',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderLeft: '1px solid #e8e5e0',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social sharing buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {socialButtons.map((s) => (
              <button
                key={s.id}
                onClick={() => window.open(s.urlFn(inviteLink), '_blank', 'width=600,height=400')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  fontSize: 16,
                  fontWeight: 700,
                  color: s.color,
                  backgroundColor: '#faf9f7',
                  border: '1px solid #e8e5e0',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0ede8';
                  e.currentTarget.style.borderColor = '#d4d1cc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#faf9f7';
                  e.currentTarget.style.borderColor = '#e8e5e0';
                }}
                title={s.label}
              >
                {s.icon}
              </button>
            ))}
          </div>

          {/* Send invite email */}
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#1a1a1a',
                marginBottom: 8,
              }}
            >
              Send invite email
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendEmail();
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: 14,
                  color: '#1a1a1a',
                  backgroundColor: '#faf9f7',
                  border: '1px solid #e8e5e0',
                  borderRadius: 10,
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#bbb')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e8e5e0')}
              />
              <button
                onClick={handleSendEmail}
                disabled={!email.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: email.trim() ? '#1a1a1a' : '#ccc',
                  border: 'none',
                  borderRadius: 10,
                  cursor: email.trim() ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (email.trim()) e.currentTarget.style.backgroundColor = '#333';
                }}
                onMouseLeave={(e) => {
                  if (email.trim()) e.currentTarget.style.backgroundColor = '#1a1a1a';
                }}
              >
                <Send size={14} />
                {sent ? 'Sent!' : 'Send'}
              </button>
            </div>
          </div>

          {/* Stats card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #e8e5e0',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 20,
              backgroundColor: '#faf9f7',
            }}
          >
            <div style={{ flex: 1, display: 'flex', gap: 40 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>0</div>
                <div style={{ fontSize: 13, color: '#999' }}>Credits</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>0</div>
                <div style={{ fontSize: 13, color: '#999' }}>Referrals</div>
              </div>
            </div>
            {/* Person silhouette illustration */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d4d1cc"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          {/* Bottom tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <button
              onClick={() => setActiveTab('redeem')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'redeem' ? 600 : 400,
                color: activeTab === 'redeem' ? '#1a1a1a' : '#999',
                padding: '4px 0',
                borderBottom: activeTab === 'redeem' ? '2px solid #1a1a1a' : '2px solid transparent',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
            >
              Redeem
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'history' ? 600 : 400,
                color: activeTab === 'history' ? '#1a1a1a' : '#999',
                padding: '4px 0',
                borderBottom: activeTab === 'history' ? '2px solid #1a1a1a' : '2px solid transparent',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
            >
              Invite history
            </button>
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
