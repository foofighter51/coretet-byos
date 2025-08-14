// Playlist Operations API Patterns for CoreTet Mobile

import { supabase } from '../supabase/client';
import { Playlist } from '../types';

// =====================================================
// PLAYLIST CRUD OPERATIONS
// =====================================================

// 1. Fetch User's Playlists
export const fetchPlaylists = async (userId: string) => {
  // Get owned playlists
  const { data: ownedPlaylists, error: ownedError } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (ownedError) {
    console.error('Error fetching owned playlists:', ownedError);
    return { playlists: [], error: ownedError };
  }
  
  // Get shared playlists
  const { data: sharedPlaylists, error: sharedError } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_shares!inner(shared_with_email)
    `)
    .eq('playlist_shares.shared_with_email', userId) // Assuming userId is email
    .order('created_at', { ascending: false });
    
  if (sharedError) {
    console.error('Error fetching shared playlists:', sharedError);
  }
  
  const allPlaylists = [
    ...ownedPlaylists,
    ...(sharedPlaylists || [])
  ];
  
  return { playlists: allPlaylists, error: null };
};

// 2. Create Playlist
export const createPlaylist = async (
  name: string,
  description?: string,
  userId?: string
) => {
  const { data, error } = await supabase
    .from('playlists')
    .insert([{
      name,
      description,
      user_id: userId,
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating playlist:', error);
    return { playlist: null, error };
  }
  
  return { playlist: data, error: null };
};

// 3. Update Playlist
export const updatePlaylist = async (
  playlistId: string,
  updates: Partial<Playlist>
) => {
  const { data, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating playlist:', error);
    return { playlist: null, error };
  }
  
  return { playlist: data, error: null };
};

// 4. Delete Playlist
export const deletePlaylist = async (playlistId: string) => {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);
    
  if (error) {
    console.error('Error deleting playlist:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// =====================================================
// PLAYLIST TRACK MANAGEMENT
// =====================================================

// 5. Get Playlist Tracks
export const getPlaylistTracks = async (playlistId: string) => {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select(`
      *,
      track:tracks(*)
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });
    
  if (error) {
    console.error('Error fetching playlist tracks:', error);
    return { tracks: [], error };
  }
  
  // Extract track data
  const tracks = data.map(item => item.track).filter(Boolean);
  
  return { tracks, error: null };
};

// 6. Add Track to Playlist
export const addTrackToPlaylist = async (
  playlistId: string,
  trackId: string,
  userId: string
) => {
  // Get current max position
  const { data: existingTracks } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);
    
  const nextPosition = existingTracks?.[0]?.position ? existingTracks[0].position + 1 : 0;
  
  const { error } = await supabase
    .from('playlist_tracks')
    .insert([{
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition,
      added_by: userId,
    }]);
    
  if (error) {
    console.error('Error adding track to playlist:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// 7. Remove Track from Playlist
export const removeTrackFromPlaylist = async (
  playlistId: string,
  trackId: string
) => {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
    
  if (error) {
    console.error('Error removing track from playlist:', error);
    return { success: false, error };
  }
  
  // Reorder remaining tracks
  await reorderPlaylistAfterRemoval(playlistId);
  
  return { success: true, error: null };
};

// 8. Reorder Playlist Tracks
export const reorderPlaylistTracks = async (
  playlistId: string,
  trackIds: string[]
) => {
  // Update positions for all tracks
  const updates = trackIds.map((trackId, index) => ({
    playlist_id: playlistId,
    track_id: trackId,
    position: index,
  }));
  
  // Delete existing entries and insert new ones with correct positions
  const { error: deleteError } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId);
    
  if (deleteError) {
    console.error('Error clearing playlist tracks:', deleteError);
    return { success: false, error: deleteError };
  }
  
  const { error: insertError } = await supabase
    .from('playlist_tracks')
    .insert(updates);
    
  if (insertError) {
    console.error('Error reordering playlist tracks:', insertError);
    return { success: false, error: insertError };
  }
  
  return { success: true, error: null };
};

// Helper: Reorder after removal
const reorderPlaylistAfterRemoval = async (playlistId: string) => {
  const { data } = await supabase
    .from('playlist_tracks')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });
    
  if (!data) return;
  
  // Update positions to be sequential
  const updates = data.map((track, index) => ({
    id: track.id,
    position: index,
  }));
  
  for (const update of updates) {
    await supabase
      .from('playlist_tracks')
      .update({ position: update.position })
      .eq('id', update.id);
  }
};

// =====================================================
// PLAYLIST SHARING
// =====================================================

// 9. Share Playlist
export const sharePlaylist = async (
  playlistId: string,
  shareWithEmail: string,
  sharedByUserId: string,
  permissions: 'view' | 'edit' = 'view'
) => {
  const { error } = await supabase
    .from('playlist_shares')
    .insert([{
      playlist_id: playlistId,
      shared_by: sharedByUserId,
      shared_with_email: shareWithEmail,
      permissions,
    }]);
    
  if (error) {
    console.error('Error sharing playlist:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// 10. Unshare Playlist
export const unsharePlaylist = async (
  playlistId: string,
  shareWithEmail: string
) => {
  const { error } = await supabase
    .from('playlist_shares')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('shared_with_email', shareWithEmail);
    
  if (error) {
    console.error('Error unsharing playlist:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// 11. Get Playlist Shares
export const getPlaylistShares = async (playlistId: string) => {
  const { data, error } = await supabase
    .from('playlist_shares')
    .select('*')
    .eq('playlist_id', playlistId);
    
  if (error) {
    console.error('Error fetching playlist shares:', error);
    return { shares: [], error };
  }
  
  return { shares: data, error: null };
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

// 12. Subscribe to Playlist Changes
export const subscribeToPlaylistChanges = (
  playlistId: string,
  callback: (payload: unknown) => void
) => {
  return supabase
    .channel(`playlist-${playlistId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'playlist_tracks',
        filter: `playlist_id=eq.${playlistId}`,
      },
      callback
    )
    .subscribe();
};

// 13. Subscribe to User's Playlists
export const subscribeToUserPlaylists = (
  userId: string,
  callback: (payload: unknown) => void
) => {
  return supabase
    .channel(`user-playlists-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'playlists',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

// =====================================================
// BATCH OPERATIONS
// =====================================================

// 14. Add Multiple Tracks to Playlist
export const addMultipleTracksToPlaylist = async (
  playlistId: string,
  trackIds: string[],
  userId: string
) => {
  // Get current max position
  const { data: existingTracks } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);
    
  const startPosition = existingTracks?.[0]?.position ? existingTracks[0].position + 1 : 0;
  
  const inserts = trackIds.map((trackId, index) => ({
    playlist_id: playlistId,
    track_id: trackId,
    position: startPosition + index,
    added_by: userId,
  }));
  
  const { error } = await supabase
    .from('playlist_tracks')
    .insert(inserts);
    
  if (error) {
    console.error('Error adding multiple tracks:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};