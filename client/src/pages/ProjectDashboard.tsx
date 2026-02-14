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
import { isAuthenticated, savePendingPrompt } from '../lib/auth';

const quickActions = [
  { label: 'Build website', icon: Globe },
  { label: 'Build app', icon: Smartphone },
  { label: 'Create API', icon: Code2 },
  { label: 'Design UI', icon: Paintbrush },
  { label: 'Other', icon: null },
];

const footerLinks: Record<string, string> = {
  'Web Application': '/dashboard',
  'AI Design': '/agents',
  'AI Slides': '/agents',
  'Browser Agent': '/agents',
  'Deep Research': '/agents',
  'Blog': '/docs',
  'Documentation': '/docs',
  'Updates': '/docs',
  'Help Center': '/docs',
  'API': '/docs',
  'Events': '/library',
  'Discord': '#',
  'Fellows': '/library',
  'Playbook': '/docs',
  'VS ChatGPT': '/agents',
  'VS Copilot': '/agents',
  'VS Cursor': '/agents',
  'Desktop App': '#',
  'Mobile App': '#',
  'VS Code Extension': '#',
  'About': '/docs',
  'Careers': '#',
  'Press': '#',
  'Privacy': '#',
  'Terms': '#',
};

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
      // Fallback: navigate to IDE with a temporary local ID
      const tempId = crypto.randomUUID();
      navigate(`/project/${tempId}`, { state: { initialPrompt: prompt.trim() } });
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
          const tempId = crypto.randomUUID();
          navigate(`/project/${tempId}`, { state: { initialPrompt: selectedPrompt } });
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
            {[
              { label: 'Features', route: '/agents' },
              { label: 'Resources', route: '/library' },
              { label: 'Docs', route: '/docs' },
              { label: 'Pricing', route: '/library' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.route}
                onClick={(e) => { e.preventDefault(); navigate(link.route); }}
                style={{
                  fontSize: 14,
                  color: '#666',
                  textDecoration: 'none',
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
              >
                {link.label}
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
          background: 'linear-gradient(90deg, #1a1a1a 0%, #2d1f3d 50%, #1a1a1a 100%)',
          padding: '10px 24px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 10px',
          fontSize: 11,
          fontWeight: 700,
          color: '#a78bfa',
          backgroundColor: '#a78bfa15',
          borderRadius: 4,
          border: '1px solid #a78bfa30',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          NEW
        </span>
        <span style={{ fontSize: 14, color: '#bbb' }}>
          Powered by <strong style={{ color: '#e9d5ff' }}>Claude Opus 4.6</strong> — Anthropic's most advanced AI model for coding
        </span>
        <a
          href="/docs"
          onClick={(e) => { e.preventDefault(); navigate('/docs'); }}
          style={{
            fontSize: 13,
            color: '#a78bfa',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          See what it can do &rarr;
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
          <div style={{ textAlign: 'center', marginTop: 60, marginBottom: 40 }}>
            {/* Opus badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              backgroundColor: '#faf8ff',
              border: '1px solid #e9d5ff',
              borderRadius: 999,
              marginBottom: 20,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                boxShadow: '0 0 8px #8b5cf640',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>
                Claude Opus 4.6
              </span>
              <span style={{ fontSize: 12, color: '#a78bfa' }}>
                Most advanced AI for coding
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
                fontSize: 'clamp(36px, 5vw, 52px)',
                fontWeight: 400,
                color: '#1a1a1a',
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              What can I build for you?
            </h1>
            <p style={{ fontSize: 16, color: '#888', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
              The only AI agent that plans, codes, debugs, deploys, and iterates — autonomously.
              Powered by Anthropic's flagship model.
            </p>
          </div>

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
                onClick={() => textareaRef.current?.focus()}
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

          {/* ── Why Opus 4.6 — capabilities ── */}
          <div style={{
            marginTop: 48,
            padding: '28px 24px',
            background: 'linear-gradient(135deg, #faf8ff 0%, #f5f0ff 50%, #faf9f7 100%)',
            borderRadius: 20,
            border: '1px solid #e9d5ff40',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                Why Masidy Agent + Opus 4.6
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                {
                  title: 'Top-tier reasoning',
                  desc: 'Opus 4.6 is Anthropic\'s most capable model — #1 on SWE-bench for real-world coding tasks. It understands complex requirements and writes production code.',
                  badge: '#1 SWE-bench',
                },
                {
                  title: 'Full autonomy',
                  desc: 'Plans, writes, debugs, tests, and deploys — all by itself. 10 integrated tools: filesystem, terminal, browser, search, deploy, and more.',
                  badge: '10 tools',
                },
                {
                  title: 'vs. ChatGPT / Copilot',
                  desc: 'ChatGPT suggests code. Copilot autocompletes. Masidy builds entire apps from a single prompt — then deploys them live.',
                  badge: 'Full stack',
                },
              ].map((item) => (
                <div key={item.title} style={{
                  padding: '16px',
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  border: '1px solid #e8e5e0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#7c3aed',
                      backgroundColor: '#f5f0ff', padding: '2px 8px',
                      borderRadius: 4, letterSpacing: '0.03em',
                    }}>{item.badge}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#777', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 24, marginTop: 16, paddingTop: 16,
              borderTop: '1px solid #e9d5ff30',
            }}>
              {[
                { label: 'Plans & Thinks', icon: '🧠' },
                { label: 'Writes Code', icon: '💻' },
                { label: 'Runs Terminal', icon: '⚡' },
                { label: 'Browses Web', icon: '🌐' },
                { label: 'Deploys Live', icon: '🚀' },
                { label: 'Debugs Errors', icon: '🔧' },
              ].map((cap) => (
                <div key={cap.label} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: '#888',
                }}>
                  <span>{cap.icon}</span>
                  <span>{cap.label}</span>
                </div>
              ))}
            </div>
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
              maxWidth: 520,
            }}
          >
            One prompt.
            <br />
            Full application.
            <br />
            <span style={{ fontSize: '0.6em', color: '#a78bfa' }}>Powered by Opus 4.6</span>
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
                        href={footerLinks[link] || '#'}
                        onClick={(e) => {
                          const route = footerLinks[link];
                          if (route && route !== '#') {
                            e.preventDefault();
                            navigate(route);
                          }
                        }}
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
              {[
                { Icon: Github, url: 'https://github.com/masidytest/Autonomous' },
                { Icon: Twitter, url: 'https://twitter.com' },
                { Icon: Youtube, url: 'https://youtube.com' },
                { Icon: Linkedin, url: 'https://linkedin.com' },
              ].map(({ Icon, url }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
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
