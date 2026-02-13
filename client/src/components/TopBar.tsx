import React from 'react';
import { Bot, Square, ArrowLeft } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';
import { useNavigate } from 'react-router-dom';

interface Props {
  onCancel?: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'bg-yellow-500' },
  executing: { label: 'Executing', color: 'bg-blue-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  failed: { label: 'Failed', color: 'bg-red-500' },
  paused: { label: 'Paused', color: 'bg-amber-500' },
};

export function TopBar({ onCancel }: Props) {
  const currentProject = useAgentStore((s) => s.currentProject);
  const isExecuting = useAgentStore((s) => s.isExecuting);
  const taskStatus = useAgentStore((s) => s.taskStatus);
  const navigate = useNavigate();

  const status = taskStatus ? statusLabels[taskStatus] : null;

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-blue-400" />
          <h1 className="text-sm font-semibold">
            {currentProject?.name || 'Masidy Agent'}
          </h1>
        </div>
        {status && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${status.color} ${
                isExecuting ? 'animate-pulse' : ''
              }`}
            />
            <span className="text-xs text-gray-400">{status.label}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isExecuting && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs transition-colors"
          >
            <Square size={12} />
            Cancel
          </button>
        )}
      </div>
    </header>
  );
}
