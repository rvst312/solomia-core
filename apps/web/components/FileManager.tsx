'use client';

import { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  LayoutGrid, 
  List as ListIcon,
  ArrowLeft,
  ArrowRight,
  FileCode,
  FileJson,
  File
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

interface FileManagerProps {
  projectId: string;
}

const FileIcon = ({ name, className = "w-6 h-6" }: { name: string, className?: string }) => {
  if (name.endsWith('.md')) return <FileText className={`${className} text-blue-400`} />;
  if (name.endsWith('.json')) return <FileJson className={`${className} text-yellow-400`} />;
  if (name.endsWith('.py') || name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js')) return <FileCode className={`${className} text-green-400`} />;
  return <File className={`${className} text-zinc-400`} />;
};

export default function FileManager({ projectId }: FileManagerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/files/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFileContent = async (file: FileNode) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/files/${projectId}/content?path=${encodeURIComponent(file.path)}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content);
        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Failed to fetch file content:', error);
    }
  };

  const getFilesInCurrentPath = () => {
    if (!currentPath) {
      return files.filter(f => !f.path.includes('/'));
    }
    return files.filter(f => {
        const parentPath = f.path.substring(0, f.path.lastIndexOf('/'));
        // Ensure exact match for parent directory
        if (parentPath !== currentPath) return false;
        // Ensure it's not a deeper nested file (though lastIndexOf check above helps, but standard behavior)
        // With backend returning full relative paths, if path is "a/b/c", parent is "a/b".
        // If currentPath is "a", we want "a/b", but not "a/b/c".
        // My logic above: f.path.substring(0, lastIndexOf('/')) gives parent path.
        return true;
    });
  };

  const handleNavigate = (path: string) => {
    if (currentPath === path) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
      setSelectedFile(null);
      setFileContent(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
      setSelectedFile(null);
      setFileContent(null);
    }
  };

  const currentFiles = getFilesInCurrentPath();

  // Sidebar folders (simplified tree)
  const renderSidebarItem = (path: string, name: string, depth = 0) => {
      // Find subdirectories directly under this path
      const subdirs = files.filter(f => 
          f.type === 'directory' && 
          (path === '' ? !f.path.includes('/') : f.path.startsWith(path + '/') && f.path.split('/').length === path.split('/').length + 1)
      );

      const isSelected = currentPath === path;

      return (
          <div key={path || 'root'}>
              <div 
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                  onClick={() => handleNavigate(path)}
              >
                  <Folder className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{name || projectId}</span>
              </div>
              {subdirs.map(dir => renderSidebarItem(dir.path, dir.name, depth + 1))}
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
           <div className="flex gap-1 mr-4">
             <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
           </div>
           <button onClick={handleBack} disabled={historyIndex === 0} className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30">
             <ArrowLeft className="w-4 h-4 text-zinc-400" />
           </button>
           <button onClick={handleForward} disabled={historyIndex === history.length - 1} className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30">
             <ArrowRight className="w-4 h-4 text-zinc-400" />
           </button>
           <span className="ml-4 text-sm font-medium text-zinc-300">
             {currentPath ? currentPath.split('/').pop() : projectId}
           </span>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1 rounded ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-zinc-800 bg-zinc-900/30 overflow-y-auto py-2 hidden sm:block">
            <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Favorites</div>
            <div className="px-3 mb-2 mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Locations</div>
            {renderSidebarItem('', projectId)}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Breadcrumbs */}
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/20 flex items-center text-xs text-zinc-500">
                <span className="cursor-pointer hover:text-zinc-300" onClick={() => handleNavigate('')}>{projectId}</span>
                {currentPath.split('/').map((part, i, arr) => (
                    part && (
                        <div key={i} className="flex items-center">
                            <ChevronRight className="w-3 h-3 mx-1" />
                            <span 
                                className="cursor-pointer hover:text-zinc-300"
                                onClick={() => handleNavigate(arr.slice(0, i + 1).join('/'))}
                            >
                                {part}
                            </span>
                        </div>
                    )
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">Loading...</div>
                ) : currentFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <Folder className="w-12 h-12 mb-2 opacity-20" />
                        <p>Empty Folder</p>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {currentFiles.map(file => (
                                <div 
                                    key={file.path}
                                    className={`
                                        flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all
                                        ${selectedFile?.path === file.path ? 'bg-blue-500/20 border-blue-500/50' : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800/60'}
                                    `}
                                    onDoubleClick={() => file.type === 'directory' ? handleNavigate(file.path) : fetchFileContent(file)}
                                    onClick={() => setSelectedFile(file)}
                                >
                                    {file.type === 'directory' ? (
                                        <Folder className="w-12 h-12 text-blue-400 mb-2" />
                                    ) : (
                                        <FileIcon name={file.name} className="w-12 h-12 mb-2" />
                                    )}
                                    <span className="text-xs text-center truncate w-full px-1 select-none">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-medium text-zinc-500 border-b border-zinc-800 mb-1">
                                <div className="col-span-8">Name</div>
                                <div className="col-span-4">Type</div>
                            </div>
                            {currentFiles.map(file => (
                                <div 
                                    key={file.path}
                                    className={`
                                        grid grid-cols-12 gap-2 px-2 py-2 rounded cursor-pointer text-sm items-center
                                        ${selectedFile?.path === file.path ? 'bg-blue-500/20 text-white' : 'hover:bg-zinc-800/50 text-zinc-300'}
                                    `}
                                    onDoubleClick={() => file.type === 'directory' ? handleNavigate(file.path) : fetchFileContent(file)}
                                    onClick={() => setSelectedFile(file)}
                                >
                                    <div className="col-span-8 flex items-center gap-2">
                                        {file.type === 'directory' ? (
                                            <Folder className="w-4 h-4 text-blue-400" />
                                        ) : (
                                            <FileIcon name={file.name} className="w-4 h-4" />
                                        )}
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                    <div className="col-span-4 text-xs text-zinc-500 capitalize">{file.type}</div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>

        {/* Preview Pane (Right Sidebar) */}
        {selectedFile && selectedFile.type === 'file' && (
            <div className="w-80 border-l border-zinc-800 bg-zinc-900/30 flex flex-col overflow-hidden absolute inset-y-0 right-0 z-20 sm:relative sm:inset-auto bg-zinc-900 sm:bg-transparent shadow-xl sm:shadow-none">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
                    <div className="flex items-center gap-2 overflow-hidden">
                         <FileIcon name={selectedFile.name} />
                         <span className="font-medium truncate">{selectedFile.name}</span>
                    </div>
                    <button 
                        onClick={() => { setFileContent(null); setSelectedFile(null); }} 
                        className="text-zinc-500 hover:text-white"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/50">
                    {fileContent ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap text-zinc-300 break-words">
                            {fileContent}
                        </pre>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                             <p className="text-xs text-zinc-500">Preview not loaded</p>
                             <button 
                                onClick={() => fetchFileContent(selectedFile)}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white border border-zinc-700"
                             >
                                Load Content
                             </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
