import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root (server/src/index.ts → ../../.. → project root)
const __dirname_boot = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname_boot, '../..', '.env') });

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import { createServer } from 'http';
import router from './routes/index.js';
import { createSocketServer } from './services/socket.js';
import { setupAuth, createAuthRouter } from './services/auth.js';

const __dirname = __dirname_boot;

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://masidy-agent.vercel.app',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow listed origins + any *.onrender.com
      if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      callback(null, true); // Permissive for now
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Authentication (GitHub OAuth)
setupAuth(app);
app.use(createAuthRouter());

// API routes
app.use(router);

// In production, serve the client build
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Create HTTP server + Socket.io
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Masidy Agent server running on port ${PORT}`);
  console.log(`WebSocket server attached`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API: http://localhost:${PORT}/api/health`);
  }
});

export { app, httpServer, io };
