import { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Play,
  AlignLeft,
  ExternalLink,
} from 'lucide-react';

/* ── Docs data ── */
const topTabs = ['Introduction', 'Features', 'Website Builder', 'Integrations'];

interface SidebarSection {
  title: string;
  items: { id: string; label: string }[];
}

const sidebarSections: Record<string, SidebarSection[]> = {
  Introduction: [
    {
      title: '',
      items: [
        { id: 'welcome', label: 'Welcome' },
        { id: 'plans', label: 'Plans & Pricing' },
      ],
    },
  ],
  Features: [
    {
      title: '',
      items: [
        { id: 'agents', label: 'AI Agents' },
        { id: 'memory', label: 'Persistent Memory' },
        { id: 'browser', label: 'Browser Cloud' },
        { id: 'code', label: 'Code Execution' },
        { id: 'files', label: 'File Management' },
      ],
    },
  ],
  'Website Builder': [
    {
      title: '',
      items: [
        { id: 'getting-started', label: 'Getting Started' },
        { id: 'templates', label: 'Templates' },
        { id: 'deploy', label: 'Deployment' },
        { id: 'domains', label: 'Custom Domains' },
      ],
    },
  ],
  Integrations: [
    {
      title: '',
      items: [
        { id: 'github-int', label: 'GitHub' },
        { id: 'vercel-int', label: 'Vercel' },
        { id: 'supabase-int', label: 'Supabase' },
        { id: 'stripe-int', label: 'Stripe' },
        { id: 'slack-int', label: 'Slack' },
      ],
    },
  ],
};

const tocItems: Record<string, string[]> = {
  welcome: ['What Makes Masidy AI Different?'],
  plans: ['Free Plan', 'Pro Plan', 'Enterprise'],
  agents: ['Creating an Agent', 'Agent Memory', 'Agent Skills'],
  memory: ['How Memory Works', 'Memory Limits'],
  browser: ['Browser Sandbox', 'Persistent Sessions'],
  code: ['Supported Languages', 'Execution Limits'],
  files: ['File Storage', 'Sharing Files'],
  'getting-started': ['Quick Start', 'Project Structure'],
  templates: ['Available Templates', 'Custom Templates'],
  deploy: ['Auto Deploy', 'Manual Deploy'],
  domains: ['Adding a Domain', 'SSL Certificates'],
  'github-int': ['Connecting GitHub', 'Auto Sync'],
  'vercel-int': ['Connecting Vercel', 'Deploy Hooks'],
  'supabase-int': ['Database Setup', 'Auth Integration'],
  'stripe-int': ['Payment Setup', 'Webhooks'],
  'slack-int': ['Bot Setup', 'Notifications'],
};

/* ── Page content per article ── */
const pageContent: Record<string, { title: string; subtitle: string; sections: { heading: string; paragraphs: string[] }[] }> = {
  welcome: {
    title: 'Welcome',
    subtitle: 'Discover Masidy and how to get started',
    sections: [
      {
        heading: '',
        paragraphs: [
          'Masidy AI is a General AI Agent designed to bridge the gap between thinking and action, planning and doing. Unlike traditional chatbots that merely respond to questions, Masidy AI acts. Think of Masidy AI as a virtual colleague with its own computer, capable of planning, executing, and delivering complete work products from start to finish.',
        ],
      },
      {
        heading: 'What Makes Masidy AI Different?',
        paragraphs: [
          'Traditional AI tools require constant supervision and manual intervention. You guide them step by step, and then assemble the results yourself. Masidy AI works differently.',
          'It operates in a complete sandbox environment — a virtual computer with Internet access, a persistent file system, and the ability to install software and create custom tools. This means Masidy AI can work independently, remember context across long tasks, and deliver production-ready results without you having to manage every detail.',
        ],
      },
    ],
  },
  plans: {
    title: 'Plans & Pricing',
    subtitle: 'Choose the right plan for your needs',
    sections: [
      {
        heading: 'Free Plan',
        paragraphs: [
          'Get started with 250 credits per month. Includes access to all core features, community support, and up to 3 concurrent projects.',
        ],
      },
      {
        heading: 'Pro Plan',
        paragraphs: [
          'Unlimited credits, priority execution queue, advanced integrations, custom agents, and dedicated support. $39/month or $390/year.',
        ],
      },
      {
        heading: 'Enterprise',
        paragraphs: [
          'Custom pricing for teams. Includes SSO, audit logs, dedicated infrastructure, SLA guarantees, and a dedicated account manager. Contact sales for details.',
        ],
      },
    ],
  },
};

export function Docs() {
  const [activeTab, setActiveTab] = useState('Introduction');
  const [activeArticle, setActiveArticle] = useState('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [askQuery, setAskQuery] = useState('');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('docs-search')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setAskOpen(true);
      }
      if (e.key === 'Escape') setAskOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const currentSections = sidebarSections[activeTab] || [];
  const content = pageContent[activeArticle] || pageContent.welcome!;
  const currentToc = tocItems[activeArticle] || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#fff',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#1a1a1a',
      }}
    >
      {/* ═══ TOP HEADER ═══ */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: '1px solid #f0ede8',
        }}
      >
        {/* Left: logo + language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                backgroundColor: '#1a1a1a',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a' }}>masidy</span>
          </a>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              color: '#888',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            English <ChevronDown size={12} />
          </button>
        </div>

        {/* Center: search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#faf9f7',
            border: '1px solid #e8e5e0',
            borderRadius: 10,
            padding: '8px 14px',
            width: 320,
          }}
        >
          <Search size={15} color="#bbb" />
          <input
            id="docs-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 13,
              color: '#1a1a1a',
              fontFamily: 'inherit',
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: '#bbb',
              backgroundColor: '#fff',
              border: '1px solid #e8e5e0',
              padding: '2px 6px',
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            Ctrl K
          </span>
        </div>

        {/* Right: Ask AI + settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setAskOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 500,
              color: '#555',
              backgroundColor: '#fff',
              border: '1px solid #e8e5e0',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ccc')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e8e5e0')}
          >
            <Sparkles size={14} color="#8b5cf6" />
            Ask AI
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#bbb',
              padding: 4,
              display: 'flex',
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          padding: '0 28px',
          borderBottom: '1px solid #f0ede8',
        }}
      >
        {topTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                const firstItem = sidebarSections[tab]?.[0]?.items[0];
                if (firstItem) setActiveArticle(firstItem.id);
              }}
              style={{
                padding: '12px 18px',
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#1a1a1a' : '#888',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #1a1a1a' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#555';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#888';
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ═══ MAIN THREE-COLUMN LAYOUT ═══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Left sidebar ── */}
        <aside
          style={{
            width: 220,
            minWidth: 220,
            padding: '20px 16px',
            borderRight: '1px solid #f0ede8',
            overflow: 'auto',
          }}
        >
          {currentSections.map((section, si) => (
            <div key={si} style={{ marginBottom: 16 }}>
              {section.title && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                    padding: '0 8px',
                  }}
                >
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = activeArticle === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveArticle(item.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'block',
                      padding: '8px 12px',
                      fontSize: 14,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? '#1a1a1a' : '#666',
                      backgroundColor: isActive ? '#f0ede8' : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      marginBottom: 2,
                      transition: 'background-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f8f6f3';
                        e.currentTarget.style.color = '#1a1a1a';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#666';
                      }
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* ── Center content ── */}
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '36px 48px 80px',
            maxWidth: 720,
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            {content.title}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: '#999',
              marginBottom: 32,
              lineHeight: 1.5,
            }}
          >
            {content.subtitle}
          </p>

          {/* Video embed placeholder */}
          {activeArticle === 'welcome' && (
            <div
              style={{
                width: '100%',
                aspectRatio: '16/9',
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                marginBottom: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              {/* Gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(60,60,80,0.8) 100%)',
                }}
              />
              {/* Title text on video */}
              <div
                style={{
                  position: 'absolute',
                  top: 24,
                  left: 28,
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                  Watch video
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                  Introducing<br />Masidy
                </div>
              </div>
              {/* Logo */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 28,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>masidy</span>
              </div>
              {/* Play button */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <Play size={22} color="#fff" fill="#fff" />
              </div>
            </div>
          )}

          {/* Text content */}
          {content.sections.map((section, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.heading && (
                <h2
                  id={section.heading.toLowerCase().replace(/\s+/g, '-').replace(/[?]/g, '')}
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: 14,
                    marginTop: i > 0 ? 36 : 0,
                  }}
                >
                  {section.heading}
                </h2>
              )}
              {section.paragraphs.map((para, pi) => (
                <p
                  key={pi}
                  style={{
                    fontSize: 15,
                    color: '#444',
                    lineHeight: 1.75,
                    marginBottom: 16,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          ))}

          {/* Bottom link */}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #f0ede8' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveArticle('plans');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 500,
                color: '#1a1a1a',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1a1a1a')}
            >
              Plans & Pricing <ChevronRight size={14} />
            </a>
          </div>

          {/* Divider + social */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: '1px solid #f0ede8',
              display: 'flex',
              gap: 16,
            }}
          >
            {['instagram', 'linkedin', 'x', 'youtube'].map((social) => (
              <button
                key={social}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ccc',
                  padding: 4,
                  display: 'flex',
                  fontSize: 16,
                  fontWeight: 700,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#ccc')}
              >
                {social === 'instagram' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                )}
                {social === 'linkedin' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                )}
                {social === 'x' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )}
                {social === 'youtube' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </main>

        {/* ── Right TOC sidebar ── */}
        <aside
          style={{
            width: 200,
            minWidth: 200,
            padding: '36px 20px',
            overflow: 'auto',
          }}
        >
          {currentToc.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#999',
                  marginBottom: 12,
                }}
              >
                <AlignLeft size={13} />
                On this page
              </div>
              {currentToc.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const el = document.getElementById(item.toLowerCase().replace(/\s+/g, '-').replace(/[?]/g, ''));
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 0',
                    fontSize: 13,
                    color: '#888',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
                >
                  {item}
                </button>
              ))}
            </>
          )}
        </aside>
      </div>

      {/* ═══ FLOATING "ASK A QUESTION" BAR ═══ */}
      {!askOpen && (
        <div
          onClick={() => setAskOpen(true)}
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 380,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            backgroundColor: '#fff',
            border: '1px solid #e8e5e0',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            cursor: 'text',
            zIndex: 50,
          }}
        >
          <span style={{ fontSize: 14, color: '#bbb', flex: 1 }}>Ask a question...</span>
          <span
            style={{
              fontSize: 11,
              color: '#bbb',
              backgroundColor: '#faf9f7',
              border: '1px solid #e8e5e0',
              padding: '2px 6px',
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            Ctrl+I
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#f0ede8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} color="#999" />
          </div>
        </div>
      )}

      {/* ═══ ASK AI MODAL ═══ */}
      {askOpen && (
        <>
          <div
            onClick={() => setAskOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.2)',
              zIndex: 999,
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 520,
              backgroundColor: '#fff',
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              border: '1px solid #e8e5e0',
              zIndex: 1000,
              padding: '16px 20px',
              animation: 'slideInModal 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Sparkles size={16} color="#8b5cf6" />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>Ask AI about Masidy</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#faf9f7',
                border: '1px solid #e8e5e0',
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              <input
                autoFocus
                type="text"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                placeholder="Type your question..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 14,
                  color: '#1a1a1a',
                  fontFamily: 'inherit',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setAskOpen(false);
                }}
              />
              <button
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: askQuery.trim() ? '#1a1a1a' : '#e0ddd8',
                  color: askQuery.trim() ? '#fff' : '#aaa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: askQuery.trim() ? 'pointer' : 'default',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#ccc', marginTop: 8, textAlign: 'right' }}>
              Press Esc to close
            </div>
          </div>
        </>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideInModal {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
