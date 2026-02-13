import React from 'react';
import { FileText, X } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';

export function CodeViewer() {
  const files = useAgentStore((s) => s.files);
  const selectedFile = useAgentStore((s) => s.selectedFile);
  const setSelectedFile = useAgentStore((s) => s.setSelectedFile);

  const currentFile = files.find((f) => f.path === selectedFile);
  const recentFiles = files.slice(-8);

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FileText size={48} className="mb-3 opacity-40" />
        <p className="text-sm">No files yet</p>
        <p className="text-xs mt-1 text-gray-600">
          Code will appear here as the agent writes files
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* File tabs */}
      <div className="flex items-center gap-0 bg-gray-900 border-b border-gray-800 overflow-x-auto">
        {recentFiles.map((file) => {
          const name = file.path.split('/').pop() || file.path;
          const isActive = file.path === selectedFile;
          return (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file.path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-gray-800 shrink-0 ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <FileText size={12} />
              <span>{name}</span>
            </button>
          );
        })}
      </div>
      {/* File path */}
      <div className="px-3 py-1 bg-gray-900/50 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-mono">{currentFile.path}</span>
      </div>
      {/* Code content */}
      <div className="flex-1 overflow-auto bg-gray-950">
        <pre className="p-4 text-xs leading-relaxed font-mono">
          <code className="text-gray-300">
            {currentFile.content.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="select-none text-gray-600 w-10 text-right pr-4 shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
