import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'development' | 'data' | 'content' | 'devops' | 'planning';
  enabled: boolean;
  builtIn: boolean;
  content: string; // The full SKILL.md body (markdown instructions)
}

interface SkillsState {
  skills: Skill[];
  toggleSkill: (id: string) => void;
  addCustomSkill: (skill: Omit<Skill, 'builtIn'>) => void;
  removeCustomSkill: (id: string) => void;
  getEnabledSkills: () => Skill[];
  getSkillsByCategory: (cat: Skill['category']) => Skill[];
}

const BUILT_IN_SKILLS: Skill[] = [
  // ── Development ──
  {
    id: 'code-generator',
    name: 'Code Generator',
    description: 'Generate production-ready code in any language — React, Node, Python, Go, Rust, and more.',
    icon: '💻',
    category: 'development',
    enabled: true,
    builtIn: true,
    content: `## Supported Stacks
**Frontend**: React (Vite, Next.js), Vue, Svelte, Angular + Tailwind, TypeScript
**Backend**: Node.js (Express, Fastify, Hono), Python (FastAPI, Flask), Go, Rust
**Mobile**: React Native, Flutter, Swift, Kotlin
**Database**: PostgreSQL, MySQL, MongoDB, Redis + ORMs (Prisma, Drizzle, SQLAlchemy)

## Code Quality Standards
1. TypeScript by default for JS projects
2. No \`any\` types — proper interfaces and type safety
3. Error handling — try/catch, validation, error boundaries
4. Clean architecture — separation of concerns
5. Modern patterns — hooks, composables, dependency injection
6. Testing — include test files for critical logic
7. Security — input validation, parameterized queries, CORS, auth`,
  },
  {
    id: 'autonomous-agent',
    name: 'Autonomous Agent',
    description: 'Build complex multi-step projects autonomously — plan, execute, debug, verify, deliver.',
    icon: '🤖',
    category: 'development',
    enabled: true,
    builtIn: true,
    content: `## Core Loop (PEDV Cycle)
1. **PLAN** — Analyze request, break into ordered steps, create todo
2. **EXECUTE** — Work through each step using tools
3. **DEBUG** — If something fails, read error, think, fix, retry
4. **VERIFY** — Test the result, run the app, check quality
5. **DELIVER** — Summarize what was built

## Execution Rules
- Always create a plan before starting
- If a step fails 3 times, try an alternative approach
- Never give up on first error — read error messages carefully
- Test work before declaring done`,
  },
  {
    id: 'api-builder',
    name: 'API Builder',
    description: 'Build REST APIs, GraphQL, WebSocket servers with auth, validation, and documentation.',
    icon: '🔌',
    category: 'development',
    enabled: true,
    builtIn: true,
    content: `## Capabilities
REST, GraphQL, WebSocket, JWT/OAuth2/API keys, validation, rate limiting, OpenAPI/Swagger docs, CORS, file uploads, pagination/filtering/sorting

## REST Conventions
- Plural resource nouns, proper HTTP methods
- Versioning: /api/v1/
- Consistent error format with status codes

## Auth Patterns
- JWT for SPAs, session cookies for SSR
- API keys for service-to-service
- OAuth2 for third-party integrations

## Security Checklist
Input validation, parameterized queries, rate limiting, CORS, Helmet, request size limits`,
  },
  {
    id: 'testing-agent',
    name: 'Testing Agent',
    description: 'Write unit, integration, E2E, and API tests with proper coverage targets.',
    icon: '🧪',
    category: 'development',
    enabled: true,
    builtIn: true,
    content: `## Frameworks
Vitest/Jest (JS/TS), Playwright (E2E), pytest (Python), cargo test (Rust)

## Standards
- AAA pattern: Arrange, Act, Assert
- 80%+ unit test coverage
- 100% coverage for critical paths
- Test types: Unit, Integration, E2E, API, Snapshot, Performance`,
  },
  {
    id: 'browser-automation',
    name: 'Browser Automation',
    description: 'Automate web browsers with Playwright, Puppeteer, or Selenium for testing and scraping.',
    icon: '🌐',
    category: 'development',
    enabled: true,
    builtIn: true,
    content: `## Tools
Playwright (recommended), Puppeteer, Selenium

## Capabilities
Form automation, E2E testing, screenshots, PDF generation, price monitoring, data extraction

## Best Practices
Headless mode by default, proper waits (not sleep), error screenshots, retry logic`,
  },
  {
    id: 'database-manager',
    name: 'Database Manager',
    description: 'Design schemas, write optimized queries, manage migrations for any database.',
    icon: '🗄️',
    category: 'development',
    enabled: true,
    builtIn: true,
    content: `## Databases
PostgreSQL, MySQL, SQLite, MongoDB, Redis

## ORMs
Drizzle, Prisma, SQLAlchemy, TypeORM, Sequelize

## Optimization
EXPLAIN ANALYZE, proper indexing, parameterized queries, connection pooling, caching strategies`,
  },

  // ── DevOps ──
  {
    id: 'deploy-manager',
    name: 'Deploy Manager',
    description: 'Deploy to Vercel, Railway, Fly.io, AWS. Docker, CI/CD, SSL, domains.',
    icon: '🚀',
    category: 'devops',
    enabled: true,
    builtIn: true,
    content: `## Platforms
Vercel (frontend/Next.js), Railway (full-stack), Fly.io (containers), Render, AWS, Cloudflare

## Capabilities
Docker containerization, CI/CD pipelines, domain/DNS config, SSL certificates, zero-downtime deploys, auto-scaling`,
  },
  {
    id: 'git-manager',
    name: 'Git Manager',
    description: 'Branching strategies, conventional commits, merge conflict resolution, monorepo support.',
    icon: '📦',
    category: 'devops',
    enabled: true,
    builtIn: true,
    content: `## Strategies
GitFlow, trunk-based development, GitHub Flow

## Standards
Conventional Commits format, universal .gitignore, proper branching`,
  },
  {
    id: 'terminal-executor',
    name: 'Terminal Executor',
    description: 'Run shell commands safely — package managers, process management, system ops.',
    icon: '⚡',
    category: 'devops',
    enabled: true,
    builtIn: true,
    content: `## Safety Rules
Validate all inputs, use set -euo pipefail, log all operations, never run rm -rf without confirmation

## Capabilities
Bash/Zsh/PowerShell, package managers (npm, pip, cargo), process management, cron jobs`,
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    description: 'Audit code for vulnerabilities — XSS, SQL injection, CSRF, dependency issues.',
    icon: '🛡️',
    category: 'devops',
    enabled: true,
    builtIn: true,
    content: `## Checklist
Input validation, authentication, authorization, data protection, headers/CORS, dependencies

## Common Vulnerabilities
XSS, SQL injection, CSRF, IDOR, secret exposure, dependency vulnerabilities — with mitigations for each`,
  },

  // ── Data & Research ──
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyze data with pandas, numpy, matplotlib. Generate charts and reports.',
    icon: '📊',
    category: 'data',
    enabled: true,
    builtIn: true,
    content: `## Stack
pandas, numpy, matplotlib, seaborn, scipy

## Workflow
Load → Clean → Explore → Visualize → Analyze → Report

## Output Formats
PNG/SVG charts, HTML dashboards, Excel spreadsheets`,
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    description: 'Structured research with citations, comparisons, and actionable recommendations.',
    icon: '🔍',
    category: 'data',
    enabled: true,
    builtIn: true,
    content: `## Process
Understand → Search → Analyze → Synthesize → Report

## Output Template
Executive Summary, Key Findings, Comparison Table, Recommendations, Sources`,
  },
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    description: 'Extract data from websites with proper rate limiting and error handling.',
    icon: '🕸️',
    category: 'data',
    enabled: true,
    builtIn: true,
    content: `## Tools
Python: requests + BeautifulSoup, Playwright, Scrapy
Node.js: cheerio + axios

## Best Practices
User-Agent headers, rate limiting, exponential backoff, respect robots.txt`,
  },

  // ── Content ──
  {
    id: 'documentation-writer',
    name: 'Documentation Writer',
    description: 'Write README files, API docs, architecture docs, user guides, changelogs.',
    icon: '📝',
    category: 'content',
    enabled: true,
    builtIn: true,
    content: `## Types
README, API docs, architecture docs, user guides, changelogs, runbooks

## Principles
Audience first, examples over explanations, progressive disclosure`,
  },
  {
    id: 'email-composer',
    name: 'Email Composer',
    description: 'Write professional emails — cold outreach, newsletters, HTML templates.',
    icon: '✉️',
    category: 'content',
    enabled: true,
    builtIn: true,
    content: `## Structure
Subject, greeting, body (1 key message), CTA, sign-off

## Tones
Formal, professional, friendly, urgent, empathetic

## Rules
Under 200 words, one CTA, mobile-friendly`,
  },
  {
    id: 'image-generator',
    name: 'Image Generator',
    description: 'Create SVGs, diagrams, charts, logos, social graphics with code.',
    icon: '🎨',
    category: 'content',
    enabled: true,
    builtIn: true,
    content: `## Capabilities
SVG icons/logos, matplotlib charts, Pillow image processing, Mermaid diagrams, Canvas graphics

## Use Cases
Icons, logos, social media graphics, diagrams, color palettes, QR codes`,
  },
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Optimize on-page SEO — meta tags, Schema.org, sitemaps, Open Graph.',
    icon: '📈',
    category: 'content',
    enabled: true,
    builtIn: true,
    content: `## On-Page Checklist
Title tags, meta descriptions, H1/headers, alt text, canonical tags, Open Graph, Twitter Cards, Schema.org JSON-LD, sitemap.xml, robots.txt

## Technical SEO
Page speed, Core Web Vitals, mobile-first, structured data`,
  },

  // ── Planning ──
  {
    id: 'project-planner',
    name: 'Project Planner',
    description: 'Plan projects with milestones, sprints, risk assessment, and time estimates.',
    icon: '📋',
    category: 'planning',
    enabled: true,
    builtIn: true,
    content: `## Framework
Define → Decompose → Estimate → Schedule → Risk Assessment

## Estimation Scale
Tiny (<1hr), Small (1-4hr), Medium (4-8hr), Large (1-3 days), XL (1-2 weeks)

## Output
Gantt charts (Mermaid), sprint boards, risk registers, milestone trackers`,
  },
  {
    id: 'workflow-automator',
    name: 'Workflow Automator',
    description: 'Automate tasks — cron jobs, ETL pipelines, API orchestration, batch processing.',
    icon: '⚙️',
    category: 'planning',
    enabled: true,
    builtIn: true,
    content: `## Triggers
Cron jobs, event-driven, webhooks, polling, message queues

## Patterns
Retry with backoff, idempotent operations, dead letter queues, circuit breakers`,
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    description: 'CRUD files, bulk rename, format conversion (CSV/JSON/YAML/XML), merge and split.',
    icon: '📁',
    category: 'planning',
    enabled: true,
    builtIn: true,
    content: `## Operations
Create, read, update, delete, bulk rename, format conversion

## Supported Formats
CSV ↔ JSON ↔ YAML ↔ XML, encoding conversion, merge/split`,
  },
];

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      skills: BUILT_IN_SKILLS,

      toggleSkill: (id) =>
        set((s) => ({
          skills: s.skills.map((sk) =>
            sk.id === id ? { ...sk, enabled: !sk.enabled } : sk,
          ),
        })),

      addCustomSkill: (skill) =>
        set((s) => ({
          skills: [...s.skills, { ...skill, builtIn: false }],
        })),

      removeCustomSkill: (id) =>
        set((s) => ({
          skills: s.skills.filter((sk) => sk.id !== id || sk.builtIn),
        })),

      getEnabledSkills: () => get().skills.filter((sk) => sk.enabled),

      getSkillsByCategory: (cat) => get().skills.filter((sk) => sk.category === cat),
    }),
    {
      name: 'masidy-skills',
      partialize: (state) => ({
        skills: state.skills.map((s) => ({
          id: s.id,
          enabled: s.enabled,
        })),
      }),
      merge: (persisted: any, current) => {
        // Merge persisted enable/disable states onto built-in skills
        const savedStates: Record<string, boolean> = {};
        if (persisted && Array.isArray((persisted as any).skills)) {
          for (const s of (persisted as any).skills) {
            savedStates[s.id] = s.enabled;
          }
        }
        return {
          ...current,
          skills: current.skills.map((sk) => ({
            ...sk,
            enabled: savedStates[sk.id] ?? sk.enabled,
          })),
        };
      },
    },
  ),
);

// Category metadata
export const SKILL_CATEGORIES: Record<Skill['category'], { label: string; color: string }> = {
  development: { label: 'Development', color: '#3b82f6' },
  devops: { label: 'DevOps', color: '#f59e0b' },
  data: { label: 'Data & Research', color: '#10b981' },
  content: { label: 'Content', color: '#8b5cf6' },
  planning: { label: 'Planning', color: '#6366f1' },
};
