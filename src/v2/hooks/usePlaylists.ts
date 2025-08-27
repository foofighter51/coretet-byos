import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface V2Playlist {
  id: string;
  name: string;
  description: string | null;
  trackIds: string[];
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface V2PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export const usePlaylists = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<V2Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all playlists for current user
  const loadPlaylists = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      if (!playlistsData) {
        setPlaylists([]);
        return;
      }

      // Get playlist tracks for all playlists
      const playlistIds = playlistsData.map(p => p.id);
      const { data: tracksData, error: tracksError } = playlistIds.length > 0
        ? await supabase
            .from('playlist_tracks')
            .select('*')
            .in('playlist_id', playlistIds)
        : { data: [], error: null };

      if (tracksError) throw tracksError;

      // Combine data
      const playlistsWithTracks: V2Playlist[] = playlistsData.map(playlist => {
        const playlistTracks = (tracksData || [])
          .filter(track => track.playlist_id === playlist.id)
          .sort((a, b) => a.position - b.position);
        
        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          trackIds: playlistTracks.map(t => t.track_id),
          trackCount: playlistTracks.length,
          createdAt: playlist.created_at,
          updatedAt: playlist.updated_at,
        };
      });

      setPlaylists(playlistsWithTracks);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new playlist
  const createPlaylist = useCallback(async (name: string, description?: string): Promise<V2Playlist | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newPlaylist: V2Playlist = {
        id: data.id,
        name: data.name,
        description: data.description,
        trackIds: [],
        trackCount: 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setPlaylists(prev => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  }, [user?.id]);

  // Delete a playlist
  const deletePlaylist = useCallback(async (playlistId: string): Promise<boolean> => {
    try {
      // Delete playlist tracks first
      await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId);

      // Delete playlist
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }, []);

  // Add track to playlist
  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string): Promise<boolean> => {
    try {
      // Get current max position
      const { data: existingTracks } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = existingTracks?.[0]?.position || 0;

      // Add track
      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: maxPosition + 1,
        });

      if (error) throw error;

      // Update local state immediately
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              trackIds: [...playlist.trackIds, trackId],
              trackCount: playlist.trackCount + 1,
              updatedAt: new Date().toISOString()
            }
          : playlist
      ));

      return true;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      return false;
    }
  }, []);

  // Remove track from playlist
  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;

      // Update local state immediately
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              trackIds: playlist.trackIds.filter(id => id !== trackId),
              trackCount: playlist.trackCount - 1,
              updatedAt: new Date().toISOString()
            }
          : playlist
      ));

      return true;
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      return false;
    }
  }, []);

  // Load playlists on mount and user change
  useEffect(() => {
    if (user?.id) {
      loadPlaylists();
    }
  }, [user?.id]);

  return {
    playlists,
    loading,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    refreshPlaylists: loadPlaylists,
  };
};