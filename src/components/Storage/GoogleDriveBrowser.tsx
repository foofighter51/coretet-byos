import React, { useState, useEffect } from 'react';
import { GoogleDriveProvider } from '../../services/storage/providers/GoogleDriveProvider';
import { useStorage } from '../../contexts/StorageContext.simple';

interface GoogleDriveFolder {
  id: string;
  name: string;
  parents: string[];
  path?: string;
  selected?: boolean;
  expanded?: boolean;
  children?: GoogleDriveFolder[];
  audioCount?: number;
}

interface GoogleDriveBrowserProps {
  onFoldersSelected: (folders: GoogleDriveFolder[]) => void;
  onClose: () => void;
}

export function GoogleDriveBrowser({ onFoldersSelected, onClose }: GoogleDriveBrowserProps) {
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolders, setSelectedFolders] = useState<GoogleDriveFolder[]>([]);
  const { getProviderInstance } = useStorage();
  
  const googleProvider = getProviderInstance('google_drive') as GoogleDriveProvider;

  useEffect(() => {
    loadRootFolders();
  }, []);

  const loadRootFolders = async () => {
    if (!googleProvider) {
      console.error('Google Drive provider not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const rootFolders = await googleProvider.browseFolders('root');
      
      // Get paths and audio counts for each folder
      const foldersWithData = await Promise.all(
        rootFolders.map(async (folder) => {
          const path = await googleProvider.getFolderPath(folder.id);
          const audioFiles = await googleProvider.discoverAudioFiles(folder.id);
          
          return {
            ...folder,
            path,
            audioCount: audioFiles.length,
            selected: false,
            expanded: false,
          };
        })
      );

      setFolders(foldersWithData);
    } catch (error) {
      console.error('Error loading Google Drive folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubfolders = async (parentFolder: GoogleDriveFolder) => {
    if (!googleProvider) return;
    
    try {
      const subfolders = await googleProvider.browseFolders(parentFolder.id);
      
      const subfoldersWithData = await Promise.all(
        subfolders.map(async (folder) => {
          const path = await googleProvider.getFolderPath(folder.id);
          const audioFiles = await googleProvider.discoverAudioFiles(folder.id);
          
          return {
            ...folder,
            path,
            audioCount: audioFiles.length,
            selected: false,
            expanded: false,
          };
        })
      );

      // Update the parent folder with its children
      setFolders(prev => prev.map(folder => 
        folder.id === parentFolder.id 
          ? { ...folder, children: subfoldersWithData, expanded: true }
          : folder
      ));
    } catch (error) {
      console.error('Error loading subfolders:', error);
    }
  };

  const toggleFolderSelection = (folder: GoogleDriveFolder) => {
    const isSelected = selectedFolders.some(f => f.id === folder.id);
    
    if (isSelected) {
      setSelectedFolders(prev => prev.filter(f => f.id !== folder.id));
    } else {
      setSelectedFolders(prev => [...prev, folder]);
    }
  };

  const toggleFolderExpansion = async (folder: GoogleDriveFolder) => {
    if (!folder.expanded && !folder.children) {
      await loadSubfolders(folder);
    } else {
      setFolders(prev => prev.map(f => 
        f.id === folder.id ? { ...f, expanded: !f.expanded } : f
      ));
    }
  };

  const renderFolder = (folder: GoogleDriveFolder, level: number = 0) => {
    const isSelected = selectedFolders.some(f => f.id === folder.id);
    const hasAudio = (folder.audioCount || 0) > 0;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id} className="select-none">
        <div 
          className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-accent-yellow/20 border border-accent-yellow/50' 
              : hasAudio 
                ? 'hover:bg-forest-light/50 border border-transparent'
                : 'hover:bg-forest-light/30 border border-transparent opacity-60'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Expansion toggle */}
          {hasChildren && (
            <button
              onClick={() => toggleFolderExpansion(folder)}
              className="mr-2 w-4 h-4 flex items-center justify-center text-silver/70 hover:text-silver"
            >
              {folder.expanded ? '▼' : '▶'}
            </button>
          )}
          
          {/* Folder icon */}
          <div className="mr-3 text-accent-yellow">
            📁
          </div>
          
          {/* Folder info */}
          <div 
            className="flex-1 min-w-0"
            onClick={() => hasAudio && toggleFolderSelection(folder)}
          >
            <div className="flex items-center justify-between">
              <span className={`font-quicksand ${hasAudio ? 'text-white' : 'text-silver/60'}`}>
                {folder.name}
              </span>
              
              {hasAudio && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-accent-yellow bg-accent-yellow/20 px-2 py-1 rounded">
                    {folder.audioCount} audio files
                  </span>
                  
                  {hasAudio && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFolderSelection(folder)}
                      className="w-4 h-4 text-accent-yellow border-forest-light rounded focus:ring-accent-yellow"
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="text-xs text-silver/50 truncate">
              {folder.path}
            </div>
          </div>
        </div>
        
        {/* Render children */}
        {folder.expanded && folder.children && (
          <div className="mt-1">
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleImport = () => {
    onFoldersSelected(selectedFolders);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-forest-main rounded-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-forest-light">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-anton text-white mb-2">
                Browse Google Drive
              </h2>
              <p className="text-silver/70 font-quicksand">
                Select folders containing your music files to import into CoreTet
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-silver/70 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-silver font-quicksand">Loading your Google Drive...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => renderFolder(folder))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-forest-light">
          <div className="flex items-center justify-between">
            <div className="text-sm text-silver/70">
              {selectedFolders.length > 0 && (
                <span>
                  {selectedFolders.length} folder{selectedFolders.length !== 1 ? 's' : ''} selected
                  {' '}({selectedFolders.reduce((sum, f) => sum + (f.audioCount || 0), 0)} audio files)
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-silver/70 hover:text-white transition-colors font-quicksand"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedFolders.length === 0}
                className={`px-6 py-2 rounded-lg font-quicksand font-medium transition-colors ${
                  selectedFolders.length > 0
                    ? 'bg-accent-yellow text-gray-900 hover:bg-accent-yellow/90'
                    : 'bg-forest-light text-silver/50 cursor-not-allowed'
                }`}
              >
                Import Selected Folders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}