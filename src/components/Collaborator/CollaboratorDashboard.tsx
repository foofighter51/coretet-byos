import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, LogOut, ListMusic, Users } from 'lucide-react';
import { useCollaborator } from '../../contexts/CollaboratorContext';
import { supabase } from '../../lib/supabase';

interface SharedPlaylist {
  id: string;
  playlist_id: string;
  playlist: {
    id: string;
    name: string;
    description?: string;
    track_count: number;
  };
  shared_by: {
    email: string;
  };
}

const CollaboratorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { collaborator, logout, loading: authLoading } = useCollaborator();
  const [playlists, setPlaylists] = useState<SharedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !collaborator) {
      navigate('/collaborate/invite');
    }
  }, [collaborator, authLoading, navigate]);

  useEffect(() => {
    if (collaborator) {
      loadSharedPlaylists();
    }
  }, [collaborator]);

  const loadSharedPlaylists = async () => {
    if (!collaborator) return;

    try {
      // Get shared playlists with track counts
      const { data, error } = await supabase
        .from('playlist_shares')
        .select(`
          id,
          playlist_id,
          playlists!inner(
            id,
            name,
            description
          ),
          profiles!playlist_shares_shared_by_fkey(email)
        `)
        .eq('collaborator_id', collaborator.id)
        .eq('status', 'active');

      if (error) throw error;

      // Get track counts for each playlist
      const playlistsWithCounts = await Promise.all(
        (data || []).map(async (share) => {
          const { count } = await supabase
            .from('playlist_tracks')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', share.playlist_id);

          return {
            ...share,
            playlist: {
              ...share.playlists,
              track_count: count || 0,
            },
            shared_by: share.profiles,
          };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/collaborate/invite');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-silver">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-dark">
      {/* Header */}
      <header className="bg-forest-main border-b border-forest-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Music2 className="w-6 h-6 text-accent-yellow" />
              <h1 className="font-anton text-xl text-silver">CoreTet Collaborate</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="font-quicksand text-sm text-silver/80">
                {collaborator?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-silver/80 hover:text-silver transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-quicksand text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="font-anton text-2xl text-silver mb-2">Shared Playlists</h2>
          <p className="font-quicksand text-silver/60">
            Listen to tracks and share your ratings with the band
          </p>
        </div>

        {playlists.length === 0 ? (
          <div className="bg-forest-main rounded-xl p-8 text-center">
            <ListMusic className="w-12 h-12 text-silver/40 mx-auto mb-4" />
            <p className="font-quicksand text-silver/60">
              No playlists shared with you yet
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((share) => (
              <button
                key={share.id}
                onClick={() => navigate(`/collaborate/playlist/${share.playlist_id}`)}
                className="bg-forest-main rounded-xl p-6 text-left hover:bg-forest-main/80 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <ListMusic className="w-8 h-8 text-accent-yellow" />
                  <span className="font-quicksand text-sm text-silver/60">
                    {share.playlist.track_count} tracks
                  </span>
                </div>
                
                <h3 className="font-anton text-lg text-silver mb-2 group-hover:text-accent-yellow transition-colors">
                  {share.playlist.name}
                </h3>
                
                {share.playlist.description && (
                  <p className="font-quicksand text-sm text-silver/60 mb-3 line-clamp-2">
                    {share.playlist.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs text-silver/40">
                  <Users className="w-3 h-3 mr-1" />
                  <span className="font-quicksand">
                    Shared by {share.shared_by.email}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CollaboratorDashboard;