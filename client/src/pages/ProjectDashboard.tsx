import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowUp,
  Plus,
  Globe,
  Smartphone,
  Paintbrush,
  Code2,
  MoreHorizontal,
  Clock,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { fetchProjects, createProject, type ProjectData } from '../lib/api';

const quickActions = [
  { label: 'Build website', icon: Globe },
  { label: 'Build app', icon: Smartphone },
  { label: 'Create API', icon: Code2 },
  { label: 'Design UI', icon: Paintbrush },
  { label: 'Other', icon: null },
];

const footerColumns = [
  {
    title: 'Product',
    links: ['Web Application', 'AI Design', 'AI Slides', 'Browser Agent', 'Deep Research'],
  },
  {
    title: 'Resources',
    links: ['Blog', 'Documentation', 'Updates', 'Help Center', 'API'],
  },
  {
    title: 'Community',
    links: ['Events', 'Discord', 'Fellows', 'Playbook'],
  },
  {
    title: 'Compare',
    links: ['VS ChatGPT', 'VS Copilot', 'VS Cursor'],
  },
  {
    title: 'Download',
    links: ['Desktop App', 'Mobile App', 'VS Code Extension'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press', 'Privacy', 'Terms'],
  },
];

export function ProjectDashboard() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [prompt]);

  async function loadProjects() {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch {
      // API may be down, silently ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!prompt.trim() || creating) return;
    setCreating(true);
    try {
      const name = prompt.trim().slice(0, 50) || 'New Project';
      const project = await createProject({ name, description: prompt.trim() });
      navigate(`/project/${project.id}`, {
        state: { initialPrompt: prompt.trim() },
      });
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  }

  function handleQuickAction(label: string) {
    const prompts: Record<string, string> = {
      'Build website': 'Build a modern responsive website',
      'Build app': 'Build a full-stack web application',
      'Create API': 'Create a REST API with authentication',
      'Design UI': 'Design a beautiful modern UI',
      Other: '',
    };
    const selectedPrompt = prompts[label] ?? '';
    if (selectedPrompt) {
      setPrompt(selectedPrompt);
      // Auto-submit for predefined quick actions
      setTimeout(async () => {
        if (creating) return;
        setCreating(true);
        try {
          const name = selectedPrompt.slice(0, 50) || 'New Project';
          const project = await createProject({ name, description: selectedPrompt });
          navigate(`/project/${project.id}`, {
            state: { initialPrompt: selectedPrompt },
          });
        } catch (err) {
          console.error('Failed to create project:', err);
        } finally {
          setCreating(false);
        }
      }, 100);
    } else {
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  const hasPrompt = prompt.trim().length > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f3ef',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#1a1a1a',
      }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          width: '100%',
          borderBottom: '1px solid #e8e5df',
          backgroundColor: '#f5f3ef',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 32px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                backgroundColor: '#1a1a1a',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#1a1a1a',
                letterSpacing: '-0.02em',
              }}
            >
              masidy
            </span>
          </div>

          {/* Center nav links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 36,
            }}
          >
            {['Features', 'Resources', 'Docs', 'Pricing'].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: 14,
                  color: '#666',
                  textDecoration: 'none',
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Auth buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to="/auth"
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#1a1a1a',
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                color: '#1a1a1a',
                backgroundColor: '#fff',
                border: '1px solid #d4d1cc',
                borderRadius: 999,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Announcement bar ── */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#1a1a1a',
          padding: '10px 24px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 14, color: '#bbb' }}>
          Masidy Agent — Autonomous AI Software Engineer
        </span>
        <a
          href="#"
          style={{
            fontSize: 14,
            color: '#fff',
            textDecoration: 'none',
            marginLeft: 12,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Learn more &rarr;
        </a>
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px 60px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 720 }}>
          {/* Hero heading */}
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontWeight: 400,
              color: '#1a1a1a',
              textAlign: 'center',
              marginTop: 80,
              marginBottom: 48,
              lineHeight: 1.15,
            }}
          >
            What can I build for you?
          </h1>

          {/* Input card */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              border: '1px solid #e4e1dc',
              boxShadow: '0 4px 32px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
            }}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              rows={3}
              style={{
                width: '100%',
                padding: '24px 28px 8px',
                fontSize: 15,
                color: '#1a1a1a',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px 18px',
              }}
            >
              <button
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#bbb',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f3ef';
                  e.currentTarget.style.color = '#888';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#bbb';
                }}
              >
                <Plus size={20} />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasPrompt || creating}
                style={{
                  width: 38,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: hasPrompt ? '#1a1a1a' : '#e8e5df',
                  color: hasPrompt ? '#fff' : '#bbb',
                  cursor: hasPrompt ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </div>

          {/* Quick action chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 24,
              flexWrap: 'wrap',
            }}
          >
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  fontSize: 14,
                  color: '#555',
                  backgroundColor: '#fff',
                  border: '1px solid #e4e1dc',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#c8c5c0';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  e.currentTarget.style.color = '#1a1a1a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e4e1dc';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = '#555';
                }}
              >
                {action.icon && <action.icon size={16} color="#999" />}
                {action.label}
              </button>
            ))}
          </div>

          {/* Recent projects */}
          {!loading && projects.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 16,
                }}
              >
                Recent Projects
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      backgroundColor: '#fff',
                      border: '1px solid #e4e1dc',
                      borderRadius: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c8c5c0';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e4e1dc';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#f5f3ef',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Code2 size={14} color="#999" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#1a1a1a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {project.name}
                        </p>
                        {project.description && (
                          <p
                            style={{
                              fontSize: 12,
                              color: '#999',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: 2,
                            }}
                          >
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: '#bbb',
                        flexShrink: 0,
                        marginLeft: 16,
                      }}
                    >
                      <Clock size={12} />
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
        {/* Tagline */}
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '64px 32px 40px',
          }}
        >
          <p
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(28px, 4vw, 42px)',
              color: '#e0e0e0',
              lineHeight: 1.25,
              maxWidth: 440,
            }}
          >
            Less structure,
            <br />
            more intelligence.
          </p>
        </div>

        {/* Links grid */}
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 32px 48px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 24,
            }}
          >
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    marginBottom: 16,
                  }}
                >
                  {col.title}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {col.links.map((link) => (
                    <li key={link} style={{ marginBottom: 10 }}>
                      <a
                        href="#"
                        style={{
                          fontSize: 13,
                          color: '#888',
                          textDecoration: 'none',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = '#fff')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = '#888')
                        }
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #333' }}>
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '20px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {[Github, Twitter, Youtube, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={{ color: '#666', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#555' }}>
              &copy; 2026 Masidy. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
