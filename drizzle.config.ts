import { defineConfig } from 'drizzle-kit';

let url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/masidy_agent';

// Ensure SSL for cloud databases (Render, Supabase)
const needsSsl = url.includes('render.com') || url.includes('supabase.co');
if (needsSsl && !url.includes('sslmode=')) {
  url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
}

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
});
