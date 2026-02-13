import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '@shared/types';
import { StepCard } from './StepCard';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  if (message.step) {
    return <StepCard step={message.step} />;
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'thinking') {
    return (
      <div className="flex mb-3">
        <div className="max-w-[80%] bg-gray-800/50 border border-gray-700/50 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-400 italic">
          <div className="flex items-center gap-2">
            <span className="inline-flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            <span>Thinking...</span>
          </div>
          <p className="mt-1 text-gray-500 text-xs line-clamp-3">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === 'error') {
    return (
      <div className="flex mb-3">
        <div className="max-w-[80%] bg-red-950/50 border border-red-800/50 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-red-300">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex mb-3">
      <div className="max-w-[80%] bg-gray-800 border border-gray-700/50 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">
        <div className="prose prose-invert prose-sm max-w-none [&_pre]:bg-gray-900 [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-green-400 [&_code]:font-mono [&_code]:text-xs">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
