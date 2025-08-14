import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import MobilePlaylistList from './MobilePlaylistList';

interface SharedPlaylist {
  id: string;
  playlist_id: string;
  status: 'pending' | 'active' | 'revoked';
  playlists: {
    id: string;
    name: string;
    description?: string;
    user_id: string;
    profiles?: {
      id: string;
      email: string;
    } | null;
    playlist_tracks?: { count: number }[];
  };
  created_at: string;
  invited_at: string;
}

const MobileSharedLists: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sharedPlaylists, setSharedPlaylists] = useState<SharedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSharedPlaylists();
    }
  }, [user]);

  const loadSharedPlaylists = async () => {
    try {
      // Get user's email first
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      
      if (!userEmail) {
        // No user email found
        setLoading(false);
        return;
      }

      // Query playlist_shares table with user's email
      const { data: shares, error } = await supabase
        .from('playlist_shares')
        .select(`
          id,
          playlist_id,
          status,
          created_at,
          invited_at
        `)
        .eq('shared_with_email', userEmail.toLowerCase())
        .in('status', ['active', 'pending'])
        .order('invited_at', { ascending: false });

      if (error) throw error;

      // If we have shares, fetch the playlist details
      const data = [];
      if (shares && shares.length > 0) {
        for (const share of shares) {
          // Get playlist details
          const { data: playlist } = await supabase
            .from('playlists')
            .select(`
              id,
              name,
              description,
              user_id
            `)
            .eq('id', share.playlist_id)
            .single();

          // Get track count
          const { count } = await supabase
            .from('playlist_tracks')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', share.playlist_id);

          if (playlist) {
            data.push({
              ...share,
              playlists: {
                ...playlist,
                playlist_tracks: [{ count: count || 0 }]
              }
            });
          }
        }
      }
        
      // If we have data, fetch the profile emails separately
      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(d => d.playlists?.user_id).filter(Boolean))];
        
        // Fetch profiles for those user IDs
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
          
        // Map profiles to playlists
        data.forEach(share => {
          if (share.playlists) {
            const profile = profiles?.find(p => p.id === share.playlists.user_id);
            share.playlists.profiles = profile || null;
          }
        });
      }

      if (error) throw error;

      // Shared playlists data loaded
      
      setSharedPlaylists(data || []);
    } catch (error) {
      // Error loading shared playlists
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlaylist = (playlist: { playlist_id?: string; id: string }) => {
    navigate('/mobile/now', { state: { playlistId: playlist.playlist_id || playlist.id } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-silver opacity-60">Loading shared playlists...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-silver">Shared With Me</h1>
        <p className="text-sm text-silver opacity-60 mt-1">
          Playlists others have shared with you
        </p>
      </div>

      {/* Shared Playlists List */}
      <MobilePlaylistList
        playlists={sharedPlaylists
          .filter(shared => shared.status === 'active' && shared.playlists)
          .map(shared => ({
            ...shared.playlists,
            id: shared.playlist_id,
            playlist_id: shared.playlist_id,
            isShared: true,
            user: shared.playlists?.profiles || null,
            track_count: shared.playlists?.playlist_tracks?.[0]?.count || 0
          }))}
        loading={loading}
        emptyMessage="No shared playlists yet. Ask friends to share their playlists with you."
        onPlaylistClick={handleSelectPlaylist}
      />
      
      {/* Show pending invitations */}
      {sharedPlaylists.filter(shared => shared.status === 'pending' && shared.playlists).length > 0 && (
        <div className="mt-4 p-4 bg-forest-main border border-accent-yellow rounded-lg">
          <p className="text-sm font-semibold text-silver mb-2">Pending Invitations</p>
          {sharedPlaylists
            .filter(shared => shared.status === 'pending' && shared.playlists)
            .map(shared => (
              <div key={shared.id} className="text-sm text-silver opacity-80 mb-1">
                • {shared.playlists?.name || 'Unknown playlist'} {shared.playlists?.profiles?.email && `from ${shared.playlists.profiles.email}`}
              </div>
            ))}
          <p className="text-xs text-silver opacity-60 mt-2">
            Check your email for invitation links to accept these playlists.
          </p>
        </div>
      )}

      {/* Invite Info */}
      <div className="mt-8 p-4 bg-forest-main border border-forest-light rounded-lg">
        <div className="flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-accent-yellow" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-silver">Want to share your playlists?</p>
            <p className="text-xs text-silver opacity-60">
              Use the desktop app to share playlists with friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSharedLists;