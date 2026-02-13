import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, FileText, Terminal, FolderTree } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';
import { fetchProject } from '../lib/api';
import { joinProject, leaveProject, createTask, cancelTask, resumeTask } from '../lib/socket';
import { TopBar } from '../components/TopBar';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { BrowserPreview } from '../components/BrowserPreview';
import { CodeViewer } from '../components/CodeViewer';
import { TerminalViewer } from '../components/TerminalViewer';
import { FileTree } from '../components/FileTree';

const tabs = [
  { id: 'browser' as const, label: 'Browser', icon: Globe },
  { id: 'code' as const, label: 'Code', icon: FileText },
  { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
  { id: 'files' as const, label: 'Files', icon: FolderTree },
];

export function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    currentProject,
    setProject,
    messages,
    activeTab,
    setActiveTab,
    currentTaskId,
    isExecuting,
    reset,
  } = useAgentStore();

  useEffect(() => {
    if (!id) return;

    // Load project
    fetchProject(id)
      .then((project) => {
        setProject({
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          framework: project.framework,
          status: project.status,
        });
        joinProject(project.id);
      })
      .catch(() => {
        navigate('/');
      });

    return () => {
      if (id) leaveProject(id);
      reset();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (prompt: string) => {
    if (!currentProject) return;
    createTask(currentProject.id, prompt);
  };

  const handleCancel = () => {
    if (currentTaskId) {
      cancelTask(currentTaskId);
    }
  };

  const handleAnswer = (answer: string) => {
    if (currentTaskId) {
      resumeTask(currentTaskId, answer);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <TopBar onCancel={handleCancel} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Chat */}
        <div className="flex flex-col w-[55%] border-r border-gray-800">
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">M</span>
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  What would you like to build?
                </h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  Describe your project and the agent will plan, code, test, and deploy it
                  for you.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            onCancel={handleCancel}
            onAnswer={handleAnswer}
          />
        </div>

        {/* Right panel: Viewer */}
        <div className="flex flex-col flex-1">
          {/* Tab bar */}
          <div className="flex items-center bg-gray-900 border-b border-gray-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'text-blue-400 border-blue-400 bg-gray-800/30'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'browser' && <BrowserPreview />}
            {activeTab === 'code' && <CodeViewer />}
            {activeTab === 'terminal' && <TerminalViewer />}
            {activeTab === 'files' && <FileTree />}
          </div>
        </div>
      </div>
    </div>
  );
}
