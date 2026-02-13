import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Clock, Folder, X } from 'lucide-react';
import { fetchProjects, createProject, type ProjectData } from '../lib/api';

export function ProjectDashboard() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        framework: framework.trim() || undefined,
      });
      navigate(`/project/${project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot size={28} className="text-blue-400" />
            <h1 className="text-xl font-bold">Masidy Agent</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-6">Projects</h2>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <Folder size={48} className="mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500 mb-2">No projects yet</p>
            <p className="text-gray-600 text-sm mb-6">
              Create your first project and let the AI agent build it for you
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="text-left p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  {project.framework && (
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                      {project.framework}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock size={12} />
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">New Project</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 hover:bg-gray-800 rounded-lg text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome App"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of the project..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Framework</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Auto-detect</option>
                  <option value="react">React</option>
                  <option value="next">Next.js</option>
                  <option value="vue">Vue</option>
                  <option value="svelte">Svelte</option>
                  <option value="express">Express</option>
                  <option value="python">Python</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
