import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';

export function TerminalViewer() {
  const terminalOutput = useAgentStore((s) => s.terminalOutput);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  if (!terminalOutput) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Terminal size={48} className="mb-3 opacity-40" />
        <p className="text-sm">No terminal output yet</p>
        <p className="text-xs mt-1 text-gray-600">
          Command output will stream here as the agent runs commands
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
        <Terminal size={14} className="text-green-400" />
        <span className="text-xs text-gray-400">Terminal Output</span>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-green-400/90"
      >
        <pre className="whitespace-pre-wrap break-words">{terminalOutput}</pre>
      </div>
    </div>
  );
}
