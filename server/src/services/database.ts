import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded before reading DATABASE_URL
// (ES module imports are hoisted, so index.ts dotenv.config() runs AFTER this file)
const __dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dir, '../../..', '.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../shared/schema.js';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/masidy_agent';

console.log(`DB connecting to: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

const client = postgres(connectionString, {
  ssl: connectionString.includes('supabase.co') ? 'require' : false,
});
export const db = drizzle(client, { schema });

export default db;
