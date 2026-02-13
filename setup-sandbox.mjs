/**
 * Sets up the Supabase sandbox infrastructure:
 * 1. sandbox_jobs table for tracking code execution
 * 2. Storage bucket "workspaces" for file persistence
 * 3. RLS policies
 */
import fs from 'fs';
import postgres from 'postgres';

// Parse DATABASE_URL from .env
const envText = fs.readFileSync('.env', 'utf-8');
const dbMatch = envText.match(/^DATABASE_URL=(.+)$/m);
if (!dbMatch) { console.error('DATABASE_URL not found in .env'); process.exit(1); }
const DATABASE_URL = dbMatch[1].trim();

const supaUrlMatch = envText.match(/^SUPABASE_URL=(.+)$/m);
const serviceKeyMatch = envText.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
const SUPABASE_URL = supaUrlMatch?.[1]?.trim();
const SERVICE_ROLE_KEY = serviceKeyMatch?.[1]?.trim();

console.log('Connecting to Supabase...');
const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function setupDatabase() {
  // 1. Create sandbox_jobs table
  console.log('\n1. Creating sandbox_jobs table...');
  await sql`
    CREATE TABLE IF NOT EXISTS sandbox_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'exec',
      command TEXT,
      code TEXT,
      language TEXT DEFAULT 'javascript',
      status TEXT NOT NULL DEFAULT 'queued',
      exit_code INTEGER,
      stdout TEXT,
      stderr TEXT,
      error TEXT,
      timeout_ms INTEGER DEFAULT 300000,
      created_at TIMESTAMPTZ DEFAULT now(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    )
  `;
  console.log('   sandbox_jobs table created');

  // Create index for polling
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sandbox_jobs_status
    ON sandbox_jobs(status) WHERE status = 'queued'
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sandbox_jobs_project
    ON sandbox_jobs(project_id)
  `;
  console.log('   Indexes created');

  // Disable RLS (we use service_role from server)
  await sql`ALTER TABLE sandbox_jobs DISABLE ROW LEVEL SECURITY`;
  console.log('   RLS disabled on sandbox_jobs');

  // 2. Create sandbox_files table for file storage metadata
  console.log('\n2. Creating sandbox_files table...');
  await sql`
    CREATE TABLE IF NOT EXISTS sandbox_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT,
      size_bytes INTEGER,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(project_id, file_path)
    )
  `;
  console.log('   sandbox_files table created');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_sandbox_files_project
    ON sandbox_files(project_id)
  `;
  await sql`ALTER TABLE sandbox_files DISABLE ROW LEVEL SECURITY`;
  console.log('   RLS disabled on sandbox_files');

  console.log('\n--- Database setup complete! ---');
}

async function setupStorage() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log('\nSkipping Storage bucket (no SUPABASE_URL or SERVICE_ROLE_KEY)');
    return;
  }

  console.log('\n3. Creating "workspaces" Storage bucket...');
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'workspaces',
        name: 'workspaces',
        public: false,
        file_size_limit: 10485760, // 10MB per file
        allowed_mime_types: null,   // Allow all types
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log('   Storage bucket "workspaces" created');
    } else if (data.message?.includes('already exists')) {
      console.log('   Storage bucket "workspaces" already exists');
    } else {
      console.log('   Storage bucket response:', data);
    }
  } catch (err) {
    console.error('   Storage bucket error:', err.message);
  }
}

async function main() {
  try {
    await setupDatabase();
    await setupStorage();
    console.log('\n=== Sandbox infrastructure ready! ===');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
