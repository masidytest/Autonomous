import { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  AlignLeft,
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
  agents: {
    title: 'AI Agents',
    subtitle: 'How Masidy AI agents work behind the scenes',
    sections: [
      {
        heading: 'Creating an Agent',
        paragraphs: [
          'When you submit a prompt, Masidy spins up an autonomous agent powered by Claude Opus 4.6. The agent receives your prompt along with any enabled skills and begins planning its approach.',
          'Each agent has access to a full sandbox environment with terminal, file system, and browser capabilities. It can install packages, write code, run tests, and take screenshots — all without any manual intervention.',
        ],
      },
      {
        heading: 'Agent Memory',
        paragraphs: [
          'Agents maintain context throughout a task session. They remember every file they have written, every command they have run, and every decision they have made. This enables multi-step workflows where the agent can build on its own previous work.',
        ],
      },
      {
        heading: 'Agent Skills',
        paragraphs: [
          'Skills are reusable instructions that augment the agent\'s capabilities. You can enable or disable skills from the Agents page. Each skill provides domain-specific knowledge — for example, the "React + Tailwind" skill teaches the agent best practices for modern React development.',
        ],
      },
    ],
  },
  memory: {
    title: 'Persistent Memory',
    subtitle: 'How project state persists across sessions',
    sections: [
      {
        heading: 'How Memory Works',
        paragraphs: [
          'Every file the agent creates is stored in the project database. When you return to a project, all previously written files are available. The agent can read and modify them in subsequent tasks.',
          'Terminal output, chat history, and deployment state are also preserved, giving you a complete record of how your project was built.',
        ],
      },
      {
        heading: 'Memory Limits',
        paragraphs: [
          'Free plan projects retain data for 30 days of inactivity. Pro plan projects are retained indefinitely. Each project can store up to 500 files with a total size limit of 100 MB.',
        ],
      },
    ],
  },
  browser: {
    title: 'Browser Cloud',
    subtitle: 'The agent\'s built-in browser for research and testing',
    sections: [
      {
        heading: 'Browser Sandbox',
        paragraphs: [
          'Each agent session includes a headless Chromium browser powered by Playwright. The agent can navigate to any URL, take screenshots, extract content, and interact with web pages.',
          'This is useful for researching APIs, checking documentation, testing deployed applications, and scraping data for your project.',
        ],
      },
      {
        heading: 'Persistent Sessions',
        paragraphs: [
          'Browser sessions persist for the duration of a task. The agent can navigate between pages, fill out forms, and verify its own work by browsing the application it just built.',
        ],
      },
    ],
  },
  code: {
    title: 'Code Execution',
    subtitle: 'Running code in the secure sandbox environment',
    sections: [
      {
        heading: 'Supported Languages',
        paragraphs: [
          'The sandbox supports Node.js (JavaScript/TypeScript), Python, and shell scripting out of the box. The agent can also install additional runtimes and tools via npm, pip, or apt-get.',
        ],
      },
      {
        heading: 'Execution Limits',
        paragraphs: [
          'Each command execution has a timeout of 120 seconds. Long-running processes like dev servers are started in the background. Free plan tasks are limited to 30 minutes total execution time; Pro plans allow up to 2 hours.',
        ],
      },
    ],
  },
  files: {
    title: 'File Management',
    subtitle: 'How the agent creates and manages project files',
    sections: [
      {
        heading: 'File Storage',
        paragraphs: [
          'All files created by the agent are stored in the project database and displayed in the Files tab of the workspace. You can view, copy, and download any file at any time.',
          'The Code tab provides a VS Code-like interface for browsing file contents with syntax highlighting.',
        ],
      },
      {
        heading: 'Sharing Files',
        paragraphs: [
          'You can download all project files as a ZIP archive using the Download button in the preview toolbar. Files can also be pushed to a GitHub repository directly from the workspace.',
        ],
      },
    ],
  },
  'getting-started': {
    title: 'Getting Started',
    subtitle: 'Build your first project in minutes',
    sections: [
      {
        heading: 'Quick Start',
        paragraphs: [
          '1. Go to the Dashboard and type a description of what you want to build.',
          '2. Press Enter or click Send. Masidy will create a project and start building.',
          '3. Watch the agent plan, write code, install dependencies, and set up your project in real time.',
          '4. When the build completes, preview your app in the browser panel, download the code, or deploy it.',
        ],
      },
      {
        heading: 'Project Structure',
        paragraphs: [
          'Masidy generates standard project structures based on the framework it selects. For React projects, you will get a typical Vite + React setup with components, styles, and configuration files. For Node.js APIs, you will get an Express server with routes and middleware.',
        ],
      },
    ],
  },
  templates: {
    title: 'Templates',
    subtitle: 'Pre-built starting points for common project types',
    sections: [
      {
        heading: 'Available Templates',
        paragraphs: [
          'Masidy offers templates for common project types: landing pages, dashboards, e-commerce storefronts, portfolio sites, API servers, and full-stack applications. Mention the template type in your prompt to get started faster.',
        ],
      },
      {
        heading: 'Custom Templates',
        paragraphs: [
          'Pro users can save any completed project as a custom template. When creating a new project, reference your template by name and the agent will use it as the foundation.',
        ],
      },
    ],
  },
  deploy: {
    title: 'Deployment',
    subtitle: 'Ship your projects to production',
    sections: [
      {
        heading: 'Auto Deploy',
        paragraphs: [
          'Click the Publish button in the workspace header to deploy your project. The agent will run the build process and deploy the output to Vercel, returning a live production URL.',
        ],
      },
      {
        heading: 'Manual Deploy',
        paragraphs: [
          'You can also download your project as a ZIP and deploy it manually to any hosting provider. The project includes all configuration files needed for deployment on Vercel, Netlify, or any static hosting service.',
        ],
      },
    ],
  },
  domains: {
    title: 'Custom Domains',
    subtitle: 'Connect your own domain to deployed projects',
    sections: [
      {
        heading: 'Adding a Domain',
        paragraphs: [
          'After deploying your project, you can add a custom domain through the Vercel dashboard. Point your domain\'s DNS records to Vercel\'s servers and the connection will be verified automatically.',
        ],
      },
      {
        heading: 'SSL Certificates',
        paragraphs: [
          'All deployments include free SSL certificates via Let\'s Encrypt. Certificates are provisioned automatically when you add a custom domain and renew before expiration.',
        ],
      },
    ],
  },
  'github-int': {
    title: 'GitHub Integration',
    subtitle: 'Connect your projects to GitHub repositories',
    sections: [
      {
        heading: 'Connecting GitHub',
        paragraphs: [
          'Sign in with GitHub to enable repository creation and code pushing. Your GitHub access token is stored securely and used only for repository operations you initiate.',
        ],
      },
      {
        heading: 'Auto Sync',
        paragraphs: [
          'After creating a GitHub repository for your project, click the GitHub button in the workspace to push your latest code. Each push creates a new commit with all project files.',
        ],
      },
    ],
  },
  'vercel-int': {
    title: 'Vercel Integration',
    subtitle: 'Deploy projects directly to Vercel',
    sections: [
      {
        heading: 'Connecting Vercel',
        paragraphs: [
          'Masidy uses the Vercel Deployments API to deploy your projects. Deployments are handled server-side — no additional Vercel account setup is required on your end.',
        ],
      },
      {
        heading: 'Deploy Hooks',
        paragraphs: [
          'Each deployment returns a unique URL. You can trigger re-deployments by clicking Publish again or by asking the agent to deploy. Previous deployment URLs remain active.',
        ],
      },
    ],
  },
  'supabase-int': {
    title: 'Supabase Integration',
    subtitle: 'Add a database and auth to your projects',
    sections: [
      {
        heading: 'Database Setup',
        paragraphs: [
          'When you ask the agent to add a database, it can set up Supabase with tables, row-level security policies, and client-side queries. The agent generates the schema and migration files automatically.',
        ],
      },
      {
        heading: 'Auth Integration',
        paragraphs: [
          'Supabase Auth provides email/password, magic link, and social login out of the box. The agent can wire up authentication flows including sign-up, sign-in, and protected routes.',
        ],
      },
    ],
  },
  'stripe-int': {
    title: 'Stripe Integration',
    subtitle: 'Add payments and subscriptions to your projects',
    sections: [
      {
        heading: 'Payment Setup',
        paragraphs: [
          'The agent can integrate Stripe Checkout for one-time payments or Stripe Billing for subscriptions. It generates the server-side API routes and client-side checkout flows.',
        ],
      },
      {
        heading: 'Webhooks',
        paragraphs: [
          'For production payment flows, the agent sets up webhook handlers to process payment events like successful charges, subscription updates, and failed payments.',
        ],
      },
    ],
  },
  'slack-int': {
    title: 'Slack Integration',
    subtitle: 'Get notifications and updates in Slack',
    sections: [
      {
        heading: 'Bot Setup',
        paragraphs: [
          'Connect a Slack bot to receive notifications when builds complete, deployments succeed, or errors occur. The agent can generate the Slack bot code and webhook handlers.',
        ],
      },
      {
        heading: 'Notifications',
        paragraphs: [
          'Configure which events trigger Slack notifications. Common options include build completion, deployment status, and error alerts. Messages include direct links back to your Masidy project.',
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
      <div className="docs-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Left sidebar ── */}
        <aside
          className="docs-sidebar"
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
          className="docs-content"
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

          {/* Hero banner */}
          {activeArticle === 'welcome' && (
            <div
              style={{
                width: '100%',
                padding: '40px 28px',
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                marginBottom: 32,
                position: 'relative',
                overflow: 'hidden',
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
              {/* Content */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>
                  Introducing Masidy
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, maxWidth: 400 }}>
                  An autonomous AI agent that plans, codes, debugs, and deploys complete applications — powered by Claude Opus 4.6.
                </div>
              </div>
              {/* Logo */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 28,
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
            {[
              { id: 'x', url: 'https://x.com' },
              { id: 'github', url: 'https://github.com/masidytest/Autonomous' },
            ].map(({ id: social, url }) => (
              <a
                key={social}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
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
                {social === 'x' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )}
                {social === 'github' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </main>

        {/* ── Right TOC sidebar ── */}
        <aside
          className="docs-toc"
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
