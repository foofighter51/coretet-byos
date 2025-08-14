// Track Operations API Patterns for CoreTet Mobile

import { supabase } from '../supabase/client';
import { Track, FilterState } from '../types';

// =====================================================
// TRACK CRUD OPERATIONS
// =====================================================

// 1. Fetch User's Tracks
export const fetchTracks = async (userId: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching tracks:', error);
    return { tracks: [], error };
  }
  
  // Calculate variation counts for primary tracks
  const tracksWithCounts = await Promise.all(
    data.map(async (track) => {
      if (!track.primary_track_id) {
        const { count } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true })
          .eq('primary_track_id', track.id)
          .is('deleted_at', null);
          
        return { ...track, variation_count: count || 0 };
      }
      return track;
    })
  );
  
  return { tracks: tracksWithCounts, error: null };
};

// 2. Create New Track
export const createTrack = async (track: Partial<Track>) => {
  const { data, error } = await supabase
    .from('tracks')
    .insert([track])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating track:', error);
    return { track: null, error };
  }
  
  return { track: data, error: null };
};

// 3. Update Track
export const updateTrack = async (trackId: string, updates: Partial<Track>) => {
  const { data, error } = await supabase
    .from('tracks')
    .update(updates)
    .eq('id', trackId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating track:', error);
    return { track: null, error };
  }
  
  return { track: data, error: null };
};

// 4. Soft Delete Track
export const deleteTrack = async (trackId: string) => {
  const { error } = await supabase
    .from('tracks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', trackId);
    
  if (error) {
    console.error('Error deleting track:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// 5. Restore Deleted Track
export const restoreTrack = async (trackId: string) => {
  const { error } = await supabase
    .from('tracks')
    .update({ deleted_at: null })
    .eq('id', trackId);
    
  if (error) {
    console.error('Error restoring track:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// =====================================================
// BULK OPERATIONS
// =====================================================

// 6. Bulk Update Tracks
export const bulkUpdateTracks = async (trackIds: string[], updates: Partial<Track>) => {
  const { error } = await supabase
    .from('tracks')
    .update(updates)
    .in('id', trackIds);
    
  if (error) {
    console.error('Error bulk updating tracks:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// 7. Bulk Delete Tracks
export const bulkDeleteTracks = async (trackIds: string[]) => {
  const { error } = await supabase
    .from('tracks')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', trackIds);
    
  if (error) {
    console.error('Error bulk deleting tracks:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// =====================================================
// SEARCH AND FILTERING
// =====================================================

// 8. Search Tracks
export const searchTracks = async (query: string, userId: string) => {
  const lowercaseQuery = query.toLowerCase();
  
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .or(`name.ilike.%${lowercaseQuery}%,artist.ilike.%${lowercaseQuery}%,collection.ilike.%${lowercaseQuery}%,genre.ilike.%${lowercaseQuery}%,mood.ilike.%${lowercaseQuery}%`);
    
  if (error) {
    console.error('Error searching tracks:', error);
    return { tracks: [], error };
  }
  
  return { tracks: data, error: null };
};

// 9. Filter Tracks (Advanced)
export const filterTracks = async (filter: FilterState, userId: string) => {
  let query = supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);
    
  // Apply filters
  if (filter.type !== 'all') {
    query = query.eq('category', filter.type);
  }
  
  if (filter.artist !== 'all') {
    query = query.eq('artist', filter.artist);
  }
  
  if (filter.collection !== 'all') {
    query = query.eq('collection', filter.collection);
  }
  
  if (filter.key !== 'all') {
    query = query.eq('key', filter.key);
  }
  
  if (filter.rating !== 'all') {
    query = query.eq(filter.rating, true);
  }
  
  if (filter.primaryOnly) {
    query = query.is('primary_track_id', null);
  }
  
  // BPM Range
  if (filter.bpmRange.min !== null) {
    query = query.gte('tempo', filter.bpmRange.min.toString());
  }
  if (filter.bpmRange.max !== null) {
    query = query.lte('tempo', filter.bpmRange.max.toString());
  }
  
  // Date Range
  if (filter.dateRange.from) {
    query = query.gte('created_at', filter.dateRange.from.toISOString());
  }
  if (filter.dateRange.to) {
    query = query.lte('created_at', filter.dateRange.to.toISOString());
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error filtering tracks:', error);
    return { tracks: [], error };
  }
  
  // Apply tag filter in memory (Supabase doesn't support array contains any)
  let filteredTracks = data;
  if (filter.tags.length > 0) {
    filteredTracks = data.filter(track => 
      filter.tags.some(tag => track.tags.includes(tag))
    );
  }
  
  return { tracks: filteredTracks, error: null };
};

// =====================================================
// FILE OPERATIONS
// =====================================================

// 10. Upload Audio File
export const uploadAudioFile = async (
  file: File, 
  userId: string,
  // onProgress callback removed for now
) => {
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  
  // For mobile, you might need to implement chunked upload
  const { data, error } = await supabase.storage
    .from('tracks')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
    
  if (error) {
    console.error('Error uploading file:', error);
    return { path: null, error };
  }
  
  return { path: data.path, error: null };
};

// 11. Get Audio File URL
export const getAudioUrl = (storagePath: string) => {
  const { data } = supabase.storage
    .from('tracks')
    .getPublicUrl(storagePath);
    
  return data.publicUrl;
};

// 12. Delete Audio File
export const deleteAudioFile = async (storagePath: string) => {
  const { error } = await supabase.storage
    .from('tracks')
    .remove([storagePath]);
    
  if (error) {
    console.error('Error deleting file:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

// 13. Subscribe to Track Changes
export const subscribeToTrackChanges = (
  userId: string,
  callback: (payload: unknown) => void
) => {
  return supabase
    .channel('track-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tracks',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

// =====================================================
// EXTENDED METADATA OPERATIONS
// =====================================================

// 14. Parse Extended Metadata from Notes
export const parseExtendedMetadata = (notes: string | null) => {
  if (!notes) return null;
  
  try {
    const parsed = JSON.parse(notes);
    if (parsed.metadata) {
      return parsed.metadata;
    }
  } catch (_e) {
    // Not JSON, return null
  }
  
  return null;
};

// 15. Save Extended Metadata
export const saveExtendedMetadata = async (
  trackId: string,
  metadata: unknown,
  plainNotes?: string
) => {
  const notes = JSON.stringify({
    notes: plainNotes || '',
    metadata,
  });
  
  return updateTrack(trackId, { notes });
};