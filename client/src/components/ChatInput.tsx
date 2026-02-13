import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';

interface Props {
  onSend: (message: string) => void;
  onCancel?: () => void;
  onAnswer?: (answer: string) => void;
}

export function ChatInput({ onSend, onCancel, onAnswer }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isExecuting, isPaused, pauseQuestion } = useAgentStore();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (isPaused && onAnswer) {
      onAnswer(trimmed);
    } else {
      onSend(trimmed);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm p-4">
      {isPaused && pauseQuestion && (
        <div className="mb-3 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-sm text-amber-200">
          <span className="font-medium">Agent asks:</span> {pauseQuestion}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isPaused
              ? 'Type your answer...'
              : isExecuting
                ? 'Agent is working...'
                : 'Describe what you want to build...'
          }
          disabled={isExecuting && !isPaused}
          rows={1}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isExecuting && !isPaused ? (
          <button
            onClick={onCancel}
            className="shrink-0 p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            title="Cancel task"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || (isExecuting && !isPaused)}
            className="shrink-0 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
