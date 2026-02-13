import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Router } from 'express';
import { db } from './database.js';
import { users } from '@shared/schema.js';
import { eq } from 'drizzle-orm';

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
        scope: ['user:email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err: any, user?: any) => void
      ) => {
        try {
          // Check if user exists
          let user = await db.query.users.findFirst({
            where: eq(users.providerId, profile.id),
          });

          if (!user) {
            // Create new user
            const email =
              profile.emails?.[0]?.value || `${profile.username}@github.com`;
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
          }

          done(null, user);
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

  router.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

  router.get(
    '/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (_req: any, res: any) => {
      res.redirect('/');
    }
  );

  router.get('/api/auth/me', (req: any, res: any) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  router.post('/api/auth/logout', (req: any, res: any) => {
    req.logout?.((err: any) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      res.json({ success: true });
    });
  });

  return router;
}
