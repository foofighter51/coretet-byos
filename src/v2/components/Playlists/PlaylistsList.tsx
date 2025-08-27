import React, { useState } from 'react';
import { Plus, Music } from 'lucide-react';
import { usePlaylists } from '../../hooks/usePlaylists';
import { PlaylistCard } from './PlaylistCard';
import { CreatePlaylistModal } from './CreatePlaylistModal';

interface PlaylistsListProps {
  onPlaylistSelect?: (playlistId: string) => void;
  onPlayPlaylist?: (playlistId: string) => void;
}

export const PlaylistsList: React.FC<PlaylistsListProps> = ({
  onPlaylistSelect,
  onPlayPlaylist
}) => {
  const { 
    playlists, 
    loading, 
    createPlaylist, 
    deletePlaylist 
  } = usePlaylists();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState<string | null>(null);

  const handleCreatePlaylist = async (name: string, description?: string) => {
    setCreatingPlaylist(true);
    try {
      const newPlaylist = await createPlaylist(name, description);
      if (newPlaylist) {
        setShowCreateModal(false);
        // Optionally select the newly created playlist
        if (onPlaylistSelect) {
          onPlaylistSelect(newPlaylist.id);
        }
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      return;
    }

    setDeletingPlaylist(playlistId);
    try {
      await deletePlaylist(playlistId);
    } catch (error) {
      console.error('Error deleting playlist:', error);
    } finally {
      setDeletingPlaylist(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Music className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Playlists
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {playlists.length}
            </span>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No playlists yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first playlist to organize your tracks
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Playlist</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className={deletingPlaylist === playlist.id ? 'opacity-50 pointer-events-none' : ''}
              >
                <PlaylistCard
                  playlist={playlist}
                  onPlay={onPlayPlaylist}
                  onDelete={handleDeletePlaylist}
                  onClick={onPlaylistSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePlaylist={handleCreatePlaylist}
        loading={creatingPlaylist}
      />
    </>
  );
};