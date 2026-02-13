import React, { useState } from 'react';
import {
  FileText,
  Terminal,
  Globe,
  Search,
  Rocket,
  Brain,
  MessageCircle,
  ListChecks,
  Eye,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import type { StepUpdate } from '@shared/types';

interface Props {
  step: StepUpdate;
}

const stepIcons: Record<string, React.ReactNode> = {
  plan: <ListChecks size={16} />,
  code: <FileText size={16} />,
  file_write: <FileText size={16} />,
  file_read: <Eye size={16} />,
  terminal: <Terminal size={16} />,
  browser: <Globe size={16} />,
  search: <Search size={16} />,
  deploy: <Rocket size={16} />,
  think: <Brain size={16} />,
  ask_user: <MessageCircle size={16} />,
};

const statusColors: Record<string, string> = {
  running: 'text-blue-400 border-blue-500/50 bg-blue-950/30',
  completed: 'text-green-400 border-green-500/30 bg-green-950/20',
  failed: 'text-red-400 border-red-500/30 bg-red-950/20',
  pending: 'text-gray-500 border-gray-700 bg-gray-900/30',
  skipped: 'text-gray-500 border-gray-700 bg-gray-900/30',
};

export function StepCard({ step }: Props) {
  const [expanded, setExpanded] = useState(false);

  const icon = stepIcons[step.type] || <FileText size={16} />;
  const colorClass = statusColors[step.status] || statusColors.pending;

  return (
    <div className="mb-2">
      <button
        onClick={() => step.output && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${colorClass} ${
          step.status === 'running' ? 'animate-pulse' : ''
        } ${step.output ? 'cursor-pointer hover:bg-gray-800/50' : 'cursor-default'}`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-sm truncate">{step.title}</span>
        <span className="shrink-0 flex items-center gap-2">
          {step.durationMs !== undefined && (
            <span className="text-xs text-gray-500">
              {step.durationMs < 1000
                ? `${step.durationMs}ms`
                : `${(step.durationMs / 1000).toFixed(1)}s`}
            </span>
          )}
          {step.status === 'running' && <Loader2 size={14} className="animate-spin" />}
          {step.status === 'completed' && <Check size={14} className="text-green-400" />}
          {step.status === 'failed' && <X size={14} className="text-red-400" />}
          {step.output &&
            (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
      </button>
      {expanded && step.output && (
        <div className="mt-1 ml-8 p-3 bg-gray-900 rounded-lg border border-gray-800 text-xs font-mono text-gray-400 max-h-40 overflow-auto whitespace-pre-wrap">
          {step.output}
        </div>
      )}
    </div>
  );
}
