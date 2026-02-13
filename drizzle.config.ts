import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/masidy_agent';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url,
    ssl: url.includes('render.com') || url.includes('supabase.co') ? 'require' : false,
  },
});
