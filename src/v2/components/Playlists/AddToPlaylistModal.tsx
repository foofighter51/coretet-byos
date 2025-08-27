import React, { useState } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { usePlaylists } from '../../hooks/usePlaylists';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackName: string;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  trackId,
  trackName
}) => {
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylists();
  const [adding, setAdding] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addedToPlaylists, setAddedToPlaylists] = useState<Set<string>>(new Set());

  const handleAddToPlaylist = async (playlistId: string) => {
    setAdding(playlistId);
    try {
      const success = await addTrackToPlaylist(playlistId, trackId);
      if (success) {
        setAddedToPlaylists(prev => new Set([...prev, playlistId]));
        // Don't close the modal, allow adding to multiple playlists
      }
    } catch (error) {
      console.error('Error adding track to playlist:', error);
    } finally {
      setAdding(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setCreating(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      if (newPlaylist) {
        const success = await addTrackToPlaylist(newPlaylist.id, trackId);
        if (success) {
          setAddedToPlaylists(prev => new Set([...prev, newPlaylist.id]));
          setShowCreateNew(false);
          setNewPlaylistName('');
          // Don't close modal, allow adding to more playlists
        }
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setAddedToPlaylists(new Set());
    setShowCreateNew(false);
    setNewPlaylistName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add to Playlist
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add "<strong>{trackName}</strong>" to a playlist:
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {/* Create New Playlist Option */}
            {!showCreateNew ? (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Create New Playlist</span>
              </button>
            ) : (
              <form onSubmit={handleCreateAndAdd} className="border-2 border-blue-300 dark:border-blue-600 rounded-lg p-3">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateNew(false);
                      setNewPlaylistName('');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim() || creating}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
                  >
                    {creating ? 'Creating...' : 'Create & Add'}
                  </button>
                </div>
              </form>
            )}

            {/* Existing Playlists */}
            {playlists.length === 0 ? (
              <div className="text-center py-4">
                <Music className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No playlists yet. Create your first one above!
                </p>
              </div>
            ) : (
              playlists.map((playlist) => {
                const isAdded = addedToPlaylists.has(playlist.id);
                const hasTrack = playlist.trackIds.includes(trackId);
                const isLoading = adding === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    onClick={() => !hasTrack && !isAdded && handleAddToPlaylist(playlist.id)}
                    disabled={hasTrack || isAdded || isLoading}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                      hasTrack
                        ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                        : isAdded
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {playlist.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {playlist.trackCount} track{playlist.trackCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : hasTrack ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-xs">Already added</span>
                      </div>
                    ) : isAdded ? (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Check className="w-4 h-4" />
                        <span className="text-xs">Added!</span>
                      </div>
                    ) : (
                      <Plus className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};