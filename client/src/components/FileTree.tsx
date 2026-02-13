import React from 'react';
import { FileText, Folder, FolderOpen } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: { path: string }[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.replace(/^\/workspace\//, '').split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = { name, path: file.path, isDir: !isLast, children: [] };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  // Sort: directories first, then alphabetical
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((n) => ({ ...n, children: sortNodes(n.children) }));
  };

  return sortNodes(root);
}

function TreeItem({
  node,
  depth,
  selectedFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const isSelected = node.path === selectedFile;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 w-full text-left py-0.5 px-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {open ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-400" />}
          <span>{node.name}</span>
        </button>
        {open && node.children.map((child) => (
          <TreeItem
            key={child.name}
            node={child}
            depth={depth + 1}
            selectedFile={selectedFile}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`flex items-center gap-1.5 w-full text-left py-0.5 px-2 text-xs rounded ${
        isSelected
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <FileText size={14} className="text-gray-500" />
      <span>{node.name}</span>
    </button>
  );
}

export function FileTree() {
  const files = useAgentStore((s) => s.files);
  const selectedFile = useAgentStore((s) => s.selectedFile);
  const setSelectedFile = useAgentStore((s) => s.setSelectedFile);
  const setActiveTab = useAgentStore((s) => s.setActiveTab);

  const tree = buildTree(files);

  const handleSelect = (path: string) => {
    setSelectedFile(path);
    setActiveTab('code');
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Folder size={48} className="mb-3 opacity-40" />
        <p className="text-sm">No files yet</p>
        <p className="text-xs mt-1 text-gray-600">
          Project files will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto py-2">
      {tree.map((node) => (
        <TreeItem
          key={node.name}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
