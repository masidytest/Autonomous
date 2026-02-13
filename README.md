# Autonomous
<p align="center">
  <img src="https://img.shields.io/badge/masidy-agent-0c93e9?style=for-the-badge&logoColor=white" alt="Masidy Agent" />
</p>

<h1 align="center">Masidy Agent</h1>

<p align="center">
  <strong>Autonomous AI Software Engineer — Plans, Codes, Browses, Deploys</strong>
</p>

<p align="center">
  Describe what you want to build. Watch the agent do it — writing code, running commands, testing in a browser, and deploying to production — all in real time.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Claude_API-191919?logo=anthropic&logoColor=white" alt="Claude API" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

---

## Demo

```
User:  Build a real-time chat app with React, Express, and Socket.io.
       Include authentication, message history, and deploy it.

Agent: ✓ Planning — 8 steps identified
       ✓ Creating project scaffold...
       ✓ Writing server/index.ts — Express + Socket.io setup
       ✓ Writing client/App.tsx — Chat UI with real-time messages
       ✓ Running: npm install
       ✓ Running: npm run dev
       ✓ Browser: navigating to localhost:5173 — screenshot captured
       ✓ Deployed → https://chat-app-x7k.masidy.app

       Done. Built and deployed a real-time chat app with auth,
       message persistence, and WebSocket-based messaging.
```

---

## Features

**Autonomous Agent Loop** — Give it a task and walk away. The agent plans, executes, debugs, and delivers without hand-holding. It handles errors, retries failed steps, and asks you only when it truly needs clarification.

**10 Built-in Tools**

| Tool | What It Does |
|------|-------------|
| `plan` | Breaks complex tasks into executable steps |
| `write_file` | Creates and edits files in the project |
| `read_file` | Reads existing files for context |
| `list_files` | Explores the project structure |
| `run_command` | Executes shell commands (npm, git, python, etc.) |
| `search_web` | Searches the web for docs, solutions, APIs |
| `browse` | Controls a real browser — navigate, click, type, screenshot |
| `deploy` | Builds and deploys to a live URL |
| `ask_user` | Pauses to ask the user a question |
| `think` | Reasons step-by-step before acting |

**Real-Time Streaming** — Watch every action as it happens. File writes, terminal output, browser screenshots, and agent reasoning stream to your screen via WebSocket.

**Sandboxed Execution** — All code runs in isolated Docker containers with memory/CPU limits, dropped capabilities, and no-new-privileges. Your host system is never at risk.

**Browser Automation** — Powered by Playwright. The agent tests its own work by navigating to the running app, taking screenshots, clicking elements, and verifying functionality.

**Persistent History** — Every task, step, file change, and conversation is stored in PostgreSQL. Resume where you left off, review past work, or learn from the agent's approach.

**One-Click Deploy** — The agent builds and deploys directly from the sandbox to a live URL on your domain.

---

## How It Works

```
┌──────────┐     prompt      ┌──────────────────┐
│          │ ──────────────► │                  │
│   User   │                 │  Agent           │
│          │ ◄────────────── │  Orchestrator    │
│          │  real-time       │                  │
│          │  streaming       │  Claude API      │
└──────────┘                 │  + Tool Use      │
                             └────────┬─────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │  Docker    │   │  Playwright  │   │  Web Search │
              │  Sandbox   │   │  Browser     │   │             │
              │            │   │              │   │             │
              │ • Files    │   │ • Navigate   │   │ • DuckDuckGo│
              │ • Terminal │   │ • Screenshot │   │ • Serper    │
              │ • Build    │   │ • Click/Type │   │ • Tavily    │
              └────────────┘   └──────────────┘   └─────────────┘
```

1. User sends a prompt via the chat interface
2. The **Orchestrator** sends the prompt to **Claude API** with 10 tool definitions
3. Claude responds with a plan and tool calls
4. The Orchestrator **executes each tool** (write files, run commands, browse)
5. Tool results are sent back to Claude for the next decision
6. This loops until Claude determines the task is complete (max 50 iterations)
7. Every action streams to the frontend via **WebSocket** in real time

---

## Quick Start

### Prerequisites

- Node.js 22+
- Docker Desktop (running)
- PostgreSQL (local or cloud)
- [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Clone the repository
git clone https://github.com/masidy/masidy-agent.git
cd masidy-agent

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY and DATABASE_URL

# Build the sandbox Docker image
docker build -t masidy-sandbox -f docker/Dockerfile.sandbox .

# Push database schema
npm run db:push

# Start development servers (client + server)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### First Task

1. Click **New Project** → name it "my-first-app"
2. Type: `Build a todo app with React and Tailwind. Add local storage persistence.`
3. Watch the agent plan, code, and build it in real time
4. Click the **Browser** tab to see screenshots of the running app

---

## Architecture

```
masidy-agent/
├── client/                     # React frontend
│   └── src/
│       ├── components/         # UI components
│       │   ├── ChatMessage.tsx      # Message bubble (user/assistant/step)
│       │   ├── StepCard.tsx         # Collapsible tool execution card
│       │   ├── ChatInput.tsx        # Prompt input with send/answer
│       │   ├── BrowserPreview.tsx   # Live screenshot viewer
│       │   ├── CodeViewer.tsx       # Monaco editor (read-only)
│       │   ├── TerminalViewer.tsx   # Terminal output display
│       │   ├── FileTree.tsx         # Project file explorer
│       │   └── TopBar.tsx           # Project header + status
│       ├── hooks/              # Custom React hooks
│       ├── lib/
│       │   └── socket.ts           # Socket.io client + event handlers
│       ├── pages/
│       │   ├── Dashboard.tsx        # Project list + create
│       │   └── Workspace.tsx        # Main agent workspace
│       └── stores/
│           └── agent-store.ts       # Zustand state management
│
├── server/                     # Node.js backend
│   └── src/
│       ├── agents/
│       │   ├── orchestrator.ts      # ★ Core agent loop (Claude + tools)
│       │   └── sandbox.ts           # Docker container management
│       ├── tools/
│       │   ├── filesystem.ts        # Read/write/list files in sandbox
│       │   ├── terminal.ts          # Execute commands in sandbox
│       │   ├── browser.ts           # Playwright browser automation
│       │   ├── search.ts            # Web search (DuckDuckGo/Serper)
│       │   └── deploy.ts            # Build + deploy from sandbox
│       ├── services/
│       │   ├── database.ts          # Drizzle ORM + Postgres
│       │   └── socket.ts            # Socket.io event routing
│       ├── routes/
│       │   └── index.ts             # REST API endpoints
│       └── index.ts                 # Server entry point
│
├── shared/                     # Shared between client + server
│   ├── schema.ts                    # Drizzle database schema
│   └── types.ts                     # TypeScript types + WS events
│
├── docker/
│   └── Dockerfile.sandbox           # Sandbox container image
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── tsconfig.server.json
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI** | Claude API (Anthropic) | Agent reasoning + tool use |
| **Frontend** | React 19 + Vite | UI framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Code Viewer** | Monaco Editor | Syntax-highlighted file viewer |
| **Terminal** | xterm.js | Terminal output display |
| **State** | Zustand | Client state management |
| **Markdown** | react-markdown + remark-gfm | Render agent messages |
| **Backend** | Express + TypeScript | API server |
| **Real-time** | Socket.io | WebSocket streaming |
| **Database** | PostgreSQL + Drizzle ORM | Persistent storage |
| **Sandbox** | Docker (dockerode) | Isolated code execution |
| **Browser** | Playwright | Headless browser automation |
| **Auth** | Passport.js (GitHub OAuth) | Authentication |

---

## Configuration

### Environment Variables

```bash
# App
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-random-secret-here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/masidy_agent

# AI — Required
ANTHROPIC_API_KEY=sk-ant-xxxxx
AI_MODEL=claude-sonnet-4-20250514    # or claude-opus-4-20250514

# OAuth — Required for auth
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# Docker Sandbox
DOCKER_SOCKET=/var/run/docker.sock
SANDBOX_IMAGE=masidy-sandbox:latest
SANDBOX_MEMORY_LIMIT=512m            # Per container
SANDBOX_CPU_LIMIT=1.0                # CPU cores per container
SANDBOX_TIMEOUT_MS=300000            # 5 min max per command

# Search — Optional (falls back to DuckDuckGo)
SERPER_API_KEY=                      # serper.dev for better search
TAVILY_API_KEY=                      # tavily.com alternative

# Deployment
DEPLOY_DOMAIN=masidy.app
```

### AI Model Selection

| Model | Speed | Quality | Cost | Recommended For |
|-------|-------|---------|------|----------------|
| `claude-sonnet-4-20250514` | Fast | Great | Lower | Most tasks |
| `claude-opus-4-20250514` | Slower | Best | Higher | Complex architecture |

---

## Database Schema

```
users ──────────── projects ──────────── tasks ──────────── steps
  │                   │                    │
  │                   │                    └── messages
  │                   │
  │                   └── files
  │                   └── deployments
  │
  └── id, email, name, plan, tokensUsedToday
```

7 tables: `users`, `projects`, `tasks`, `steps`, `messages`, `files`, `deployments`

Run `npm run db:studio` to browse the database with Drizzle Studio.

---

## API Reference

### Projects
```
GET    /api/projects          # List all projects
POST   /api/projects          # Create project {name, description, framework}
GET    /api/projects/:id      # Get project details
DELETE /api/projects/:id      # Delete project + stop container
```

### Tasks
```
GET    /api/projects/:id/tasks   # List tasks for project
GET    /api/tasks/:id            # Get task with details
GET    /api/tasks/:id/steps      # Get steps for task
```

### WebSocket Events

**Client → Server**
```
task:create    {projectId, prompt}     # Start a new task
task:cancel    {taskId}                # Cancel running task
task:resume    {taskId, answer}        # Answer agent's question
project:join   {projectId}            # Join project room
project:leave  {projectId}            # Leave project room
```

**Server → Client**
```
task:started        {taskId}
task:planning       {taskId, plan}
step:started        {taskId, step}
step:completed      {taskId, step}
step:failed         {taskId, step, error}
task:completed      {taskId, result}
task:failed         {taskId, error}
task:paused         {taskId, question}
file:changed        {projectId, path, content}
terminal:output     {projectId, data}
browser:screenshot  {taskId, url, imageBase64}
agent:thinking      {taskId, thought}
agent:message       {taskId, content}
```

---

## Deployment

### Production Build

```bash
npm run build          # Builds client (Vite) + server (TypeScript)
npm start              # Runs the production server
```

### Docker Compose (Full Stack)

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/masidy_agent
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: masidy_agent
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
```

> **Note:** The app container needs access to the Docker socket to manage sandbox containers. In production, consider using Docker-in-Docker or a remote Docker host for better isolation.

---

## Roadmap

- [x] Core agent loop with Claude tool use
- [x] Docker sandbox for isolated execution
- [x] 10 built-in tools (files, terminal, browser, search, deploy)
- [x] Real-time WebSocket streaming
- [x] PostgreSQL persistence
- [ ] GitHub OAuth authentication
- [ ] Multi-model support (OpenAI, Gemini, local models)
- [ ] Collaborative mode (multiple users watching/interacting)
- [ ] Git integration (auto-commit, push to GitHub)
- [ ] Custom tool plugins (user-defined tools)
- [ ] Agent memory (learns preferences across tasks)
- [ ] Visual builder mode (drag-and-drop alongside agent)
- [ ] Workflow automation triggers
- [ ] Self-hosted one-click deploy (Docker Compose)
- [ ] VS Code extension (use Masidy Agent from your editor)
- [ ] Mobile app (monitor agent tasks on the go)

---

## Security

- **Sandboxed execution** — All user code runs in Docker containers with dropped Linux capabilities, non-root user, memory/CPU limits, and `no-new-privileges` flag
- **Network isolation** — Sandbox containers run on a bridge network with restricted egress
- **Command timeouts** — Every shell command has a configurable timeout (default 30s)
- **Iteration limits** — Agent loop is capped at 50 iterations to prevent runaway tasks
- **Token limits** — Daily token usage caps per user plan
- **No host access** — Sandbox containers cannot access the host filesystem or other containers

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Fork and clone
git clone https://github.com/your-username/masidy-agent.git

# Install dependencies
npm install

# Create branch
git checkout -b feature/your-feature

# Make changes, then
git commit -m "feat: description"
git push origin feature/your-feature
```

---

## License

MIT © [Masidy](https://masidy.com)

---

<p align="center">
  Built with Claude API by <a href="https://masidy.com">masidy.com</a>
</p>
