import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/auth';
import { createProject } from '../lib/api';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const err = params.get('error');

      if (err) {
        setError(err);
        return;
      }

      if (!token) {
        setError('No authentication token received');
        return;
      }

      // Store token
      setToken(token);

      // Check for pending prompt saved before auth redirect
      const pendingPrompt = sessionStorage.getItem('masidy_pending_prompt');
      if (pendingPrompt) {
        sessionStorage.removeItem('masidy_pending_prompt');
        try {
          const name = pendingPrompt.slice(0, 50) || 'New Project';
          const project = await createProject({ name, description: pendingPrompt });
          navigate(`/project/${project.id}`, {
            state: { initialPrompt: pendingPrompt },
            replace: true,
          });
          return;
        } catch {
          // If project creation fails, just go to dashboard
        }
      }

      navigate('/dashboard', { replace: true });
    }

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f3ef',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h2 style={{ fontSize: 20, color: '#1a1a1a', marginBottom: 12 }}>
            Authentication Failed
          </h2>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '10px 24px',
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
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f3ef',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e0ddd8',
            borderTopColor: '#1a1a1a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ fontSize: 15, color: '#888' }}>Signing you in...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
