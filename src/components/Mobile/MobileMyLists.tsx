import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import MobilePlaylistList from './MobilePlaylistList';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  track_count?: number;
  updated_at: string;
}

const MobileMyLists: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    if (user) {
      loadPlaylists();
    }
  }, [user]);

  const loadPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          updated_at,
          playlist_tracks(count)
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedPlaylists = data?.map(playlist => ({
        ...playlist,
        track_count: playlist.playlist_tracks?.[0]?.count || 0
      })) || [];

      setPlaylists(formattedPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name: newPlaylistName,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setPlaylists([data, ...playlists]);
      setNewPlaylistName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handlePlaylistOptions = async (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${playlist.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlist.id);

      if (error) throw error;

      setPlaylists(playlists.filter(p => p.id !== playlist.id));
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    // Navigate to now playing with this playlist
    navigate('/mobile/now', { state: { playlistId: playlist.id } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-silver opacity-60">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-silver">My Playlists</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-3 bg-accent-yellow text-forest-dark rounded-lg hover:bg-yellow-400 transition-all duration-200 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Playlists List */}
      <MobilePlaylistList
        playlists={playlists}
        loading={loading}
        emptyMessage="No playlists yet. Tap the + button to create one."
        onPlaylistClick={handleSelectPlaylist}
        onPlaylistOptions={handlePlaylistOptions}
      />

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-forest-main border border-forest-light rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-silver mb-4">Create New Playlist</h2>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full px-4 py-2 bg-forest-dark border border-forest-light rounded-lg text-silver placeholder-silver placeholder-opacity-40 focus:outline-none focus:border-accent-yellow"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-forest-light text-silver rounded-lg hover:bg-forest-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1 px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMyLists;