import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Router } from 'express';
import { db } from './database.js';
import { users } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { generateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'masidy-dev-secret-change-in-production';

export function setupAuth(app: any) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const GITHUB_CALLBACK_URL =
    process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback';

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.log('GitHub OAuth not configured — auth endpoints disabled');
    return;
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: GITHUB_CALLBACK_URL,
        scope: ['user:email', 'repo'],
      },
      async (
        accessToken: string,
        _refreshToken: string,
        profile: any,
        done: (err: any, user?: any) => void
      ) => {
        try {
          let user = await db.query.users.findFirst({
            where: eq(users.providerId, profile.id),
          });

          const email =
            profile.emails?.[0]?.value || `${profile.username}@github.com`;

          if (!user) {
            const [newUser] = await db
              .insert(users)
              .values({
                email,
                name: profile.displayName || profile.username,
                avatarUrl: profile.photos?.[0]?.value || null,
                provider: 'github',
                providerId: profile.id,
              })
              .returning();
            user = newUser;
          } else {
            // Update avatar on each login
            await db
              .update(users)
              .set({ avatarUrl: profile.photos?.[0]?.value || user.avatarUrl })
              .where(eq(users.id, user.id));
          }

          // Store GitHub access token for later API use (repo creation, push)
          await db
            .update(users)
            .set({ githubAccessToken: accessToken })
            .where(eq(users.id, user.id));
          done(null, { ...user, githubAccessToken: accessToken });
        } catch (err) {
          done(err);
        }
      }
    )
  );

  app.use(passport.initialize());
  app.use(passport.session());
}

export function createAuthRouter(): Router {
  const router = Router();

  router.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

  router.get(
    '/api/auth/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${CLIENT_URL}/auth?error=failed` }),
    (req: any, res: any) => {
      // Generate JWT including githubAccessToken
      const token = generateToken({ id: req.user.id, email: req.user.email });

      // Store the GitHub access token in a short-lived JWT for the frontend
      const ghToken = req.user.githubAccessToken;
      if (ghToken) {
        // Store in a separate httpOnly cookie or encode in the main token
        // For simplicity, we'll let the frontend request it via /api/auth/me
      }

      res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
    }
  );

  router.get('/api/auth/me', async (req: any, res: any) => {
    // Try JWT first (from Authorization header)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        const user = await db.query.users.findFirst({ where: eq(users.id, decoded.id) });
        if (user) {
          return res.json(user);
        }
        return res.status(401).json({ error: 'User not found' });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // Fallback to session
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json(req.user);
    }

    res.status(401).json({ error: 'Not authenticated' });
  });

  router.post('/api/auth/logout', (req: any, res: any) => {
    req.logout?.((err: any) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      res.json({ success: true });
    });
  });

  return router;
}
