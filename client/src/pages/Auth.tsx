import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleOAuth(provider: string) {
    if (provider === 'github') {
      window.location.href = '/api/auth/github';
    }
  }

  function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // For now, just redirect to dashboard — real email auth can be added later
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 800);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f3ef',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top-left logo */}
      <div style={{ padding: '24px 32px' }}>
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
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            masidy
          </span>
        </a>
      </div>

      {/* Centered content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px 60px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          {/* Big logo icon */}
          <div
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
              fontSize: 32,
              fontWeight: 400,
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            Sign in or sign up
          </h1>
          <p style={{ fontSize: 15, color: '#888', marginBottom: 36 }}>
            Start building with Masidy Agent
          </p>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* GitHub */}
            <button
              onClick={() => handleOAuth('github')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 500,
                color: '#1a1a1a',
                backgroundColor: '#fff',
                border: '1px solid #d4d1cc',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                position: 'relative',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#aaa';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d4d1cc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Github size={20} />
              <span>Continue with GitHub</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#0066ff',
                  backgroundColor: '#e8f0ff',
                  padding: '3px 8px',
                  borderRadius: 999,
                  marginLeft: 4,
                }}
              >
                Recommended
              </span>
            </button>

            {/* Google */}
            <button
              onClick={() => handleOAuth('google')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 500,
                color: '#1a1a1a',
                backgroundColor: '#fff',
                border: '1px solid #d4d1cc',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#aaa';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d4d1cc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Google icon */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Microsoft */}
            <button
              onClick={() => handleOAuth('microsoft')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 500,
                color: '#1a1a1a',
                backgroundColor: '#fff',
                border: '1px solid #d4d1cc',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#aaa';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d4d1cc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Microsoft icon */}
              <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              <span>Continue with Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              margin: '28px 0',
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
            <span style={{ fontSize: 13, color: '#999' }}>Or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailContinue}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: 15,
                color: '#1a1a1a',
                backgroundColor: '#fff',
                border: '1px solid #d4d1cc',
                borderRadius: 12,
                outline: 'none',
                fontFamily: 'inherit',
                marginBottom: 16,
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#999')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#d4d1cc')}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: loading ? '#999' : '#555',
                border: 'none',
                borderRadius: 12,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#333';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#555';
              }}
            >
              {loading ? 'Continuing...' : 'Continue'}
            </button>
          </form>

          {/* Bottom branding */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#bbb', marginBottom: 4 }}>powered by</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#888', letterSpacing: '-0.01em' }}>
              masidy
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <a
          href="#"
          style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#555')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
        >
          Terms of Service
        </a>
        <a
          href="#"
          style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#555')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
        >
          Privacy Policy
        </a>
        <span style={{ fontSize: 13, color: '#ccc' }}>&copy; 2026 Masidy</span>
      </div>
    </div>
  );
}
