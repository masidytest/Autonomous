import { Router } from 'express';
import { db } from '../services/database.js';
import { projects, tasks, steps, files, users, deployments } from '../../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import archiver from 'archiver';
import { Octokit } from '@octokit/rest';

const router = Router();

// Health check
router.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Projects ──

router.get('/api/projects', optionalAuth, async (req: any, res) => {
  try {
    const where = req.authUser
      ? eq(projects.userId, req.authUser.id)
      : undefined;
    const result = await db.query.projects.findMany({
      where,
      orderBy: [desc(projects.updatedAt)],
    });
    res.json(result);
  } catch (error: any) {
    console.error('GET /api/projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/projects', optionalAuth, async (req: any, res) => {
  try {
    const { name, description, framework } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      uuidv4().substring(0, 6);

    const [project] = await db
      .insert(projects)
      .values({
        name,
        description: description || null,
        framework: framework || null,
        slug,
        userId: req.authUser?.id || null,
      })
      .returning();

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    await db.delete(projects).where(eq(projects.id, req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Tasks ──

router.get('/api/projects/:id/tasks', async (req, res) => {
  try {
    const result = await db.query.tasks.findMany({
      where: eq(tasks.projectId, req.params.id),
      orderBy: [desc(tasks.createdAt)],
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, req.params.id),
      with: {
        steps: {
          orderBy: [steps.stepIndex],
        },
      },
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/tasks', async (_req, res) => {
  try {
    const result = await db.query.tasks.findMany({
      orderBy: [desc(tasks.createdAt)],
      limit: 20,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/tasks/:id/steps', async (req, res) => {
  try {
    const result = await db.query.steps.findMany({
      where: eq(steps.taskId, req.params.id),
      orderBy: [steps.stepIndex],
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── GitHub Integration ──

router.post('/api/projects/:id/github/create-repo', requireAuth, async (req: any, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.authUser.id),
    });
    if (!user?.githubAccessToken) {
      return res.status(400).json({ error: 'GitHub not connected. Please re-authenticate.' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, isPrivate } = req.body;
    const octokit = new Octokit({ auth: user.githubAccessToken });

    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: name || project.slug,
      description: description || project.description || `Created with Masidy Agent`,
      private: isPrivate ?? false,
      auto_init: false,
    });

    res.json({ repoUrl: repo.html_url, fullName: repo.full_name });
  } catch (error: any) {
    console.error('GitHub create repo error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/projects/:id/github/push', requireAuth, async (req: any, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.authUser.id),
    });
    if (!user?.githubAccessToken) {
      return res.status(400).json({ error: 'GitHub not connected. Please re-authenticate.' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all project files from DB
    const projectFiles = await db.query.files.findMany({
      where: eq(files.projectId, req.params.id),
    });

    if (!projectFiles.length) {
      return res.status(400).json({ error: 'No files to push' });
    }

    const { message, repoFullName } = req.body;
    if (!repoFullName) {
      return res.status(400).json({ error: 'repoFullName is required' });
    }

    const [owner, repo] = repoFullName.split('/');
    const octokit = new Octokit({ auth: user.githubAccessToken });

    // Create blobs for each file
    const blobs = await Promise.all(
      projectFiles.filter(f => !f.isDirectory && f.content).map(async (f) => {
        const { data } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(f.content || '').toString('base64'),
          encoding: 'base64',
        });
        return {
          path: f.path.replace(/^\/workspace\//, '').replace(/^\//, ''),
          mode: '100644' as const,
          type: 'blob' as const,
          sha: data.sha,
        };
      })
    );

    // Try to get the latest commit (repo may be empty)
    let baseTree: string | undefined;
    let parentSha: string | undefined;
    try {
      const { data: ref } = await octokit.git.getRef({ owner, repo, ref: 'heads/main' });
      parentSha = ref.object.sha;
      const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: parentSha });
      baseTree = commit.tree.sha;
    } catch {
      // Empty repo, no parent
    }

    // Create tree
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      tree: blobs,
      base_tree: baseTree,
    });

    // Create commit
    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: message || 'Update from Masidy Agent',
      tree: tree.sha,
      parents: parentSha ? [parentSha] : [],
    });

    // Update ref (or create it for empty repos)
    try {
      await octokit.git.updateRef({
        owner,
        repo,
        ref: 'heads/main',
        sha: commit.sha,
      });
    } catch {
      await octokit.git.createRef({
        owner,
        repo,
        ref: 'refs/heads/main',
        sha: commit.sha,
      });
    }

    res.json({
      commitSha: commit.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    });
  } catch (error: any) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Deploy via Vercel API ──

router.post('/api/projects/:id/deploy', requireAuth, async (req: any, res) => {
  try {
    const VERCEL_TOKEN = process.env.VERCEL_DEPLOYMENT_TOKEN || process.env.VERCEL_TOKEN;
    if (!VERCEL_TOKEN) {
      return res.status(500).json({ error: 'Vercel deployment token not configured' });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all project files
    const projectFiles = await db.query.files.findMany({
      where: eq(files.projectId, req.params.id),
    });

    if (!projectFiles.length) {
      return res.status(400).json({ error: 'No files to deploy' });
    }

    // Build the Vercel deployment payload
    const vercelFiles = projectFiles
      .filter(f => !f.isDirectory && f.content)
      .map(f => ({
        file: f.path.replace(/^\/workspace\//, '').replace(/^\//, ''),
        data: f.content || '',
      }));

    const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: project.slug,
        files: vercelFiles,
        projectSettings: {
          framework: project.framework || null,
        },
      }),
    });

    if (!deployResponse.ok) {
      const errData = await deployResponse.json().catch(() => ({}));
      return res.status(500).json({ error: (errData as any).error?.message || 'Vercel deployment failed' });
    }

    const deployData = await deployResponse.json() as any;
    const deployUrl = `https://${deployData.url}`;

    // Save to DB
    await db.insert(deployments).values({
      projectId: req.params.id,
      url: deployUrl,
      status: 'live',
    });

    await db
      .update(projects)
      .set({ deployUrl })
      .where(eq(projects.id, req.params.id));

    res.json({ url: deployUrl, id: deployData.id });
  } catch (error: any) {
    console.error('Vercel deploy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Download as ZIP ──

router.get('/api/projects/:id/download', async (req: any, res) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectFiles = await db.query.files.findMany({
      where: eq(files.projectId, req.params.id),
    });

    if (!projectFiles.length) {
      return res.status(400).json({ error: 'No files to download' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.slug}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const f of projectFiles) {
      if (!f.isDirectory && f.content) {
        const filePath = f.path.replace(/^\/workspace\//, '').replace(/^\//, '');
        archive.append(f.content, { name: filePath });
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// ── Share ──

router.post('/api/projects/:id/share', requireAuth, async (req: any, res) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const shareUrl = `${CLIENT_URL}/project/${project.id}`;

    res.json({ shareUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
