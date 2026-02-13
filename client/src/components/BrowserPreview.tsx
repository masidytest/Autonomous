import React from 'react';
import { Globe } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';

export function BrowserPreview() {
  const browserScreenshot = useAgentStore((s) => s.browserScreenshot);

  if (!browserScreenshot) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Globe size={48} className="mb-3 opacity-40" />
        <p className="text-sm">No browser activity yet</p>
        <p className="text-xs mt-1 text-gray-600">
          Screenshots will appear here when the agent browses the web
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700 text-xs">
        <Globe size={14} className="text-gray-400" />
        <span className="text-gray-400 truncate flex-1">{browserScreenshot.url}</span>
      </div>
      <div className="flex-1 overflow-auto bg-white">
        <img
          src={`data:image/png;base64,${browserScreenshot.imageBase64}`}
          alt="Browser screenshot"
          className="w-full"
        />
      </div>
    </div>
  );
}
