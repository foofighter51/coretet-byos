import React from 'react';
import { Play, Music, MoreVertical, Trash2 } from 'lucide-react';
import { V2Playlist } from '../../hooks/usePlaylists';

interface PlaylistCardProps {
  playlist: V2Playlist;
  onPlay?: (playlistId: string) => void;
  onDelete?: (playlistId: string) => void;
  onClick?: (playlistId: string) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onPlay,
  onDelete,
  onClick
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(playlist.id);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay && playlist.trackCount > 0) {
      onPlay(playlist.id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) {
      onDelete(playlist.id);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {playlist.name}
            </h3>
            {playlist.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {playlist.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {playlist.trackCount > 0 && (
              <button
                onClick={handlePlayClick}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Play className="w-5 h-5" />
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Music className="w-4 h-4" />
            <span>{playlist.trackCount} track{playlist.trackCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(playlist.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};