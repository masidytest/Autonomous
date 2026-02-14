import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { SearchModal } from '../components/SearchModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { InviteModal } from '../components/InviteModal';
import { SettingsModal } from '../components/SettingsModal';
import { createProject } from '../lib/api';
import { useSkillsStore, SKILL_CATEGORIES, type Skill } from '../stores/skills-store';
import {
  Search,
  ToggleLeft,
  ToggleRight,
  Zap,
  Filter,
} from 'lucide-react';

const categoryOrder: Skill['category'][] = ['development', 'devops', 'data', 'content', 'planning'];

export function Agents() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [activeCategory, setActiveCategory] = useState<Skill['category'] | 'all'>('all');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const { skills, toggleSkill } = useSkillsStore();

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const filteredSkills = skills.filter((sk) => {
    if (activeCategory !== 'all' && sk.category !== activeCategory) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      return (
        sk.name.toLowerCase().includes(q) ||
        sk.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const enabledCount = skills.filter((s) => s.enabled).length;

  return (
    <div
      className="page-with-sidebar"
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f5f3ef',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NewProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={async (data) => {
          try {
            const project = await createProject(data);
            navigate(`/project/${project.id}`, {
              state: data.description ? { initialPrompt: data.description } : undefined,
            });
          } catch (err) {
            console.error('Failed to create project:', err);
          }
        }}
      />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Mobile navigation */}
      <MobileNav
        activePage="agents"
        onSearchClick={() => setSearchOpen(true)}
        onNewProject={() => setProjectModalOpen(true)}
        onInviteClick={() => setInviteOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ display: 'flex' }}>
        <Sidebar
          activePage="agents"
          onSearchClick={() => setSearchOpen(true)}
          onNewProject={() => setProjectModalOpen(true)}
          onInviteClick={() => setInviteOpen(true)}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>

      <main className="page-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Page header */}
        <header style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>Skills</h1>
            <p style={{ fontSize: 13, color: '#999' }}>
              {enabledCount} of {skills.length} skills active — these enhance what Masidy Agent can do
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', fontSize: 12, fontWeight: 600,
              color: '#7c3aed', backgroundColor: '#f5f0ff',
              border: '1px solid #e9d5ff', borderRadius: 8,
            }}>
              <Zap size={13} />
              Powered by Opus 4.6
            </div>
          </div>
        </header>

        {/* Filter bar */}
        <div className="skills-filter-bar" style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', backgroundColor: '#fff',
            border: '1px solid #e8e5e0', borderRadius: 10,
            flex: 1, maxWidth: 320,
          }}>
            <Search size={14} color="#999" />
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search skills..."
              style={{
                border: 'none', outline: 'none', flex: 1,
                fontSize: 13, color: '#1a1a1a', fontFamily: 'inherit',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          {/* Category filters */}
          <div className="skills-category-filters" style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 500,
                color: activeCategory === 'all' ? '#1a1a1a' : '#888',
                backgroundColor: activeCategory === 'all' ? '#fff' : 'transparent',
                border: activeCategory === 'all' ? '1px solid #e8e5e0' : '1px solid transparent',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              All
            </button>
            {categoryOrder.map((cat) => {
              const meta = SKILL_CATEGORIES[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 14px', fontSize: 12, fontWeight: 500,
                    color: isActive ? meta.color : '#888',
                    backgroundColor: isActive ? '#fff' : 'transparent',
                    border: isActive ? `1px solid ${meta.color}30` : '1px solid transparent',
                    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 40px' }}>
          <div className="skills-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {filteredSkills.map((skill) => {
              const catMeta = SKILL_CATEGORIES[skill.category];
              const isExpanded = expandedSkill === skill.id;

              return (
                <div
                  key={skill.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    border: skill.enabled ? `1px solid ${catMeta.color}25` : '1px solid #e8e5e0',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    opacity: skill.enabled ? 1 : 0.6,
                  }}
                >
                  <div style={{ padding: '16px 18px' }}>
                    {/* Top row: icon + name + toggle */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: skill.enabled ? `${catMeta.color}10` : '#f5f3ef',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          {skill.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                            {skill.name}
                          </div>
                          <div style={{
                            display: 'inline-flex', padding: '1px 6px',
                            fontSize: 10, fontWeight: 600, color: catMeta.color,
                            backgroundColor: `${catMeta.color}10`,
                            borderRadius: 4, marginTop: 2,
                          }}>
                            {catMeta.label}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleSkill(skill.id)}
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: 2,
                          color: skill.enabled ? catMeta.color : '#ccc',
                        }}
                        title={skill.enabled ? 'Disable skill' : 'Enable skill'}
                      >
                        {skill.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 12, color: '#777', lineHeight: 1.5, margin: '0 0 10px' }}>
                      {skill.description}
                    </p>

                    {/* Expand/collapse */}
                    <button
                      onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                      style={{
                        background: 'none', border: 'none',
                        fontSize: 11, color: catMeta.color,
                        cursor: 'pointer', fontFamily: 'inherit',
                        fontWeight: 500, padding: 0,
                      }}
                    >
                      {isExpanded ? 'Hide details' : 'View capabilities'}
                    </button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{
                      padding: '12px 18px 16px',
                      borderTop: '1px solid #f0ede8',
                      backgroundColor: '#faf9f7',
                      fontSize: 12, color: '#555',
                      lineHeight: 1.7,
                    }}>
                      {skill.content.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) {
                          return <div key={i} style={{ fontWeight: 700, color: '#1a1a1a', marginTop: i > 0 ? 10 : 0, marginBottom: 4, fontSize: 13 }}>{line.replace('## ', '')}</div>;
                        }
                        if (line.startsWith('**') && line.includes('**:')) {
                          const [bold, rest] = line.split('**:');
                          return <div key={i}><strong>{bold.replace(/\*\*/g, '')}</strong>:{rest}</div>;
                        }
                        if (line.match(/^\d+\.\s/)) {
                          return <div key={i} style={{ paddingLeft: 8 }}>{line}</div>;
                        }
                        if (line.startsWith('- ')) {
                          return <div key={i} style={{ paddingLeft: 8 }}>- {line.slice(2)}</div>;
                        }
                        if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
                        return <div key={i}>{line}</div>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredSkills.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              <Filter size={32} color="#ccc" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 500, color: '#666' }}>No skills found</p>
              <p style={{ fontSize: 13 }}>Try a different search or category</p>
            </div>
          )}

          {/* Info box */}
          <div style={{
            marginTop: 32, padding: '20px 24px',
            backgroundColor: '#faf8ff',
            border: '1px solid #e9d5ff40',
            borderRadius: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Zap size={15} color="#7c3aed" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>How Skills Work</span>
            </div>
            <p style={{ fontSize: 13, color: '#777', lineHeight: 1.7, margin: 0 }}>
              Skills are specialized instruction sets that enhance Masidy Agent's capabilities. When a skill is enabled,
              its knowledge and best practices are automatically available during your builds. Disable skills you don't
              need to keep the agent focused. All {skills.length} built-in skills are crafted for Claude Opus 4.6 and
              cover the full software development lifecycle.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
