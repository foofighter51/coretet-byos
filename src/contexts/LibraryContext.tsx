import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Track, TrackCategory, Collection, Playlist } from '../types';
import { supabase, type Database } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useError } from './ErrorContext';
import { withRetry, retryNetworkRequest } from '../utils/retryHelper';

interface LibraryContextType {
  tracks: Track[];
  collections: Collection[];
  playlists: Playlist[];
  sharedPlaylists: Playlist[];
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  addCollection: (collection: Collection) => void;
  removeCollection: (id: string) => void;
  getTracksByCategory: (category: TrackCategory) => Track[];
  searchTracks: (query: string) => Track[];
  getTracksByTag: (tag: string) => Track[];
  getAllUsedTags: () => { tag: string; count: number }[];
  refreshTracks: () => Promise<void>;
  // Playlist methods
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylistTracks: (playlistId: string, preserveOrder?: boolean) => Track[];
  reorderPlaylistTracks: (playlistId: string, orderedTrackIds: string[]) => Promise<void>;
  reorderCollectionTracks: (collectionName: string, orderedTrackIds: string[]) => Promise<void>;
  getCollectionTrackOrder: (collectionName: string) => Promise<string[]>;
  // Soft delete methods
  getDeletedTracks: () => Promise<Track[]>;
  restoreTrack: (id: string) => Promise<void>;
  permanentlyDeleteTrack: (id: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [sharedPlaylists, setSharedPlaylists] = useState<Playlist[]>([]);
  const collectionOrderCacheRef = useRef<Record<string, string[]>>({});
  const { user, refreshProfile } = useAuth();
  const { handleError } = useError();

  // Load tracks and playlists from database when user logs in
  useEffect(() => {
    if (user) {
      loadTracks();
      loadPlaylists();
    } else {
      // Clear data when user logs out
      setTracks([]);
      setPlaylists([]);
      setSharedPlaylists([]);
    }
  }, [user]);

  const loadTracks = async () => {
    if (!user) {
      // No user found when loading tracks
      return;
    }
    
    try {
      
      const { data: dbTracks, error } = await supabase
        .from('tracks')
        .select(`
          id,
          user_id,
          name,
          file_name,
          file_size,
          storage_path,
          duration,
          category,
          tags,
          artist,
          collection,
          tempo,
          key,
          time_signature,
          genre,
          mood,
          notes,
          listened,
          liked,
          loved,
          primary_track_id,
          deleted_at,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tracks:', error);
        handleError(error, { operation: 'loadTracks', userId: user.id });
        return;
      }

      // Process tracks data
      
      if (dbTracks) {
        // User ratings table was removed in cleanup
        const ratingsMap = new Map<string, string>();

        // Get variation counts for all tracks
        const { data: variationCounts } = await supabase
          .from('tracks')
          .select('primary_track_id')
          .eq('user_id', user.id)
          .not('primary_track_id', 'is', null)
          .is('deleted_at', null);
        
        // Count variations for each primary track
        const variationCountMap = new Map<string, number>();
        variationCounts?.forEach(track => {
          if (track.primary_track_id) {
            const count = variationCountMap.get(track.primary_track_id) || 0;
            variationCountMap.set(track.primary_track_id, count + 1);
          }
        });

        // Create a map of all tracks in variation groups (primary_id -> total count including primary)
        const variationGroupMap = new Map<string, number>();
        variationCountMap.forEach((count, primaryId) => {
          // Total group size is variations + 1 (the primary)
          variationGroupMap.set(primaryId, count + 1);
        });

        // Convert database tracks to Track type, filtering out ghost tracks
        const formattedTracks: Track[] = await Promise.all(
          dbTracks
            .filter(track => track.duration && track.duration > 0) // Filter out tracks without duration
            .map(async (track) => {
              // Get public URL (bucket is public)
              // Note: storage_path should not be URL encoded when passed to getPublicUrl
              const { data: urlData } = supabase.storage
                .from('audio-files')
                .getPublicUrl(track.storage_path);
              
              const userRating = ratingsMap.get(track.id);
              
              return {
                id: track.id,
                name: track.name,
                file: null, // File object not stored in DB
                url: urlData?.publicUrl || '',
                duration: track.duration || 0,
                category: track.category as TrackCategory,
                uploadedAt: new Date(track.created_at),
                tags: track.tags || [],
                // Optional metadata
                artist: track.artist,
                collection: track.collection,
                tempo: track.tempo,
                key: track.key,
                mood: track.mood,
                genre: track.genre,
                notes: track.notes,
                timeSignature: track.time_signature,
                // Rating fields - now from user_track_ratings
                listened: userRating === 'listened',
                liked: userRating === 'liked',
                loved: userRating === 'loved',
                // Variations
                primary_track_id: track.primary_track_id,
                variation_count: track.primary_track_id 
                  ? variationGroupMap.get(track.primary_track_id) || 0  // For variations, show total group count
                  : variationCountMap.get(track.id) || 0,              // For primary tracks, show variation count
              };
            })
        );
        
        setTracks(formattedTracks);
        // Tracks set in state
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      // Set empty array on error to show "no tracks" UI
      setTracks([]);
    }
  };

  const addTrack = useCallback((track: Track) => {
    setTracks(prev => [track, ...prev]);
  }, []);

  const removeTrack = useCallback(async (id: string) => {
    try {
      // Soft delete - just set deleted_at timestamp
      const { error } = await supabase
        .from('tracks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setTracks(prev => prev.filter(track => track.id !== id));
      
      // Note: Storage files are NOT deleted immediately
      // They will be cleaned up after 30 days by a scheduled job
    } catch (error) {
      console.error('Error removing track:', error);
      throw error; // Re-throw to let caller handle it
    }
  }, []);

  const updateTrack = useCallback(async (id: string, updates: Partial<Track>) => {
    
    try {
      // Update local state immediately
      setTracks(prev => prev.map(track => 
        track.id === id ? { ...track, ...updates } : track
      ));

      // Update in database
      // Using 'any' to bypass TypeScript cache issues with removed 'analysis' column
      const dbUpdates: any = {};
      
      // Add basic fields if provided
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.artist !== undefined) dbUpdates.artist = updates.artist;
      if (updates.collection !== undefined) dbUpdates.collection = updates.collection;
      
      // Handle rating fields separately using user_track_ratings table
      if (updates.listened !== undefined || updates.liked !== undefined || updates.loved !== undefined) {
        // Determine which rating to set
        let newRating: string | null = null;
        if (updates.loved) newRating = 'loved';
        else if (updates.liked) newRating = 'liked';
        else if (updates.listened) newRating = 'listened';
        
        if (newRating) {
          // Upsert the rating
          await supabase
            .from('user_track_ratings')
            .upsert({
              track_id: id,
              user_id: user?.id,
              rating: newRating
            });
        } else {
          // Remove the rating
          await supabase
            .from('user_track_ratings')
            .delete()
            .eq('track_id', id)
            .eq('user_id', user?.id);
        }
      }

      // Add metadata fields directly to dbUpdates
      if (updates.tempo !== undefined) {
        dbUpdates.tempo = updates.tempo;
      }
      if (updates.key !== undefined) {
        dbUpdates.key = updates.key;
      }
      if (updates.mood !== undefined) {
        dbUpdates.mood = updates.mood;
      }
      if (updates.genre !== undefined) {
        dbUpdates.genre = updates.genre;
      }
      if (updates.notes !== undefined) {
        dbUpdates.notes = updates.notes;
      }
      if (updates.timeSignature !== undefined) {
        dbUpdates.time_signature = updates.timeSignature;
      }

      if (Object.keys(dbUpdates).length > 0) {
        
        const { data, error } = await supabase
          .from('tracks')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user?.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          console.error('Failed update payload:', dbUpdates);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        // Database update successful
        
        // Verify the returned data has the updated values
        if (data && data.length > 0) {
          // Track metadata updated successfully
        }
      } else {
        // No database updates needed
      }
    } catch (error) {
      console.error('Error updating track:', error);
      // Revert local state on error
      const track = tracks.find(t => t.id === id);
      if (track) {
        setTracks(prev => prev.map(t => 
          t.id === id ? track : t
        ));
      }
    }
  }, [tracks, user]);

  const addCollection = useCallback((collection: Collection) => {
    setCollections(prev => [...prev, collection]);
  }, []);

  const removeCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(collection => collection.id !== id));
  }, []);

  const getTracksByCategory = useCallback((category: TrackCategory) => {
    return tracks.filter(track => track.category === category);
  }, [tracks]);

  const searchTracks = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return tracks.filter(track => 
      track.name.toLowerCase().includes(lowercaseQuery) ||
      track.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      (track.artist && track.artist.toLowerCase().includes(lowercaseQuery)) ||
      (track.collection && track.collection.toLowerCase().includes(lowercaseQuery)) ||
      (track.key && track.key.toLowerCase().includes(lowercaseQuery)) ||
      (track.mood && track.mood.toLowerCase().includes(lowercaseQuery)) ||
      (track.genre && track.genre.toLowerCase().includes(lowercaseQuery)) ||
      (track.notes && track.notes.toLowerCase().includes(lowercaseQuery))
    );
  }, [tracks]);

  const getTracksByTag = useCallback((tag: string) => {
    return tracks.filter(track => track.tags.includes(tag));
  }, [tracks]);

  const getAllUsedTags = useCallback(() => {
    const tagCounts: Record<string, number> = {};
    tracks.forEach(track => {
      track.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [tracks]);

  // Playlist methods
  const loadPlaylists = async () => {
    if (!user) return;
    
    try {
      // First verify we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session when loading playlists');
        return;
      }
      
      // Loading playlists for user (both owned and shared)
      
      // Load user's own playlists
      const { data: ownPlaylists, error: ownError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError && ownError.code !== '42P01') {
        console.error('Error loading own playlists:', ownError);
      }

      // Load shared playlists
      const { data: sharedData, error: sharedError } = await supabase
        .from('playlist_shares')
        .select(`
          playlist_id,
          status,
          can_edit,
          can_rate,
          created_at,
          playlists!inner(*)
        `)
        .eq('shared_with_email', user.email?.toLowerCase())
        .eq('status', 'active');
      
      if (sharedError && sharedError.code !== '42P01') {
        console.error('Error loading shared playlists:', sharedError);
      }

      const playlistError = ownError && ownError.code !== '42P01' ? ownError : null;

      if (playlistError) {
        console.error('Error loading playlists:', playlistError);
        // If table doesn't exist, just return empty array
        if (playlistError.code === '42P01') {
          setPlaylists([]);
          setSharedPlaylists([]);
          return;
        }
        // For permission errors, set empty and continue
        if (playlistError.code === '42501') {
          console.error('Permission denied loading playlists');
          setPlaylists([]);
          setSharedPlaylists([]);
          return;
        }
        throw playlistError;
      }

      // Load playlist tracks for all playlists
      const allPlaylistIds = [
        ...(ownPlaylists || []).map(p => p.id),
        ...(sharedData?.map(share => share.playlist_id) || [])
      ];
      
      let playlistTracks = null;
      if (allPlaylistIds.length > 0) {
        const { data, error: tracksError } = await supabase
          .from('playlist_tracks')
          .select('*')
          .in('playlist_id', allPlaylistIds)
          .order('position', { ascending: true });

        if (tracksError) {
          console.error('Error loading playlist tracks:', tracksError);
          if (tracksError.code === '42P01' || tracksError.code === '42501') {
            playlistTracks = [];
          } else {
            throw tracksError;
          }
        } else {
          playlistTracks = data;
        }
      }

      // Format owned playlists
      const formattedOwnPlaylists: Playlist[] = (ownPlaylists || []).map(playlist => {
        const trackIds = (playlistTracks || [])
          .filter(pt => pt.playlist_id === playlist.id)
          .map(pt => pt.track_id);

        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          trackIds,
          userId: playlist.user_id,
          createdAt: new Date(playlist.created_at),
          updatedAt: new Date(playlist.updated_at),
        };
      });

      // Format shared playlists
      const formattedSharedPlaylists: Playlist[] = (sharedData || []).map(share => {
        const playlist = share.playlists;
        const trackIds = (playlistTracks || [])
          .filter(pt => pt.playlist_id === playlist.id)
          .map(pt => pt.track_id);

        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          trackIds,
          userId: playlist.user_id,
          isShared: true,
          shareInfo: {
            ownerId: playlist.user_id,
            canEdit: share.can_edit,
            canRate: share.can_rate,
            sharedAt: new Date(share.created_at),
          },
          createdAt: new Date(playlist.created_at),
          updatedAt: new Date(playlist.updated_at),
        };
      });

      setPlaylists(formattedOwnPlaylists);
      setSharedPlaylists(formattedSharedPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
      // Set empty array on error to prevent UI issues
      setPlaylists([]);
      setSharedPlaylists([]);
    }
  };

  const createPlaylist = useCallback(async (name: string, description?: string): Promise<Playlist> => {
    if (!user) throw new Error('You must be logged in to create playlists');

    // Creating playlist for user
    
    const { data, error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Playlist creation error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check database policies.');
      }
      if (error.code === '42P01') {
        throw new Error('Playlist feature not available. Database tables may need to be created.');
      }
      throw error;
    }

    const newPlaylist: Playlist = {
      id: data.id,
      name: data.name,
      description: data.description,
      trackIds: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    setPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist;
  }, [user]);

  const deletePlaylist = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePlaylist = useCallback(async (id: string, updates: Partial<Playlist>) => {
    const { error } = await supabase
      .from('playlists')
      .update({
        name: updates.name,
        description: updates.description,
        updated_at: new Date(),
      })
      .eq('id', id);

    if (error) throw error;

    setPlaylists(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
  }, []);

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    if (!user) throw new Error('You must be logged in to modify playlists');
    
    // Get current playlist
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) throw new Error('Playlist not found');

    // Check if track already exists in playlist
    if (playlist.trackIds.includes(trackId)) {
      // Track already in playlist
      return;
    }

    const position = playlist.trackIds.length;

    const { error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        position,
      });

    if (error) {
      console.error('Error adding track to playlist:', error);
      if (error.code === '42P01') {
        throw new Error('Playlist feature not available. Database tables may need to be created.');
      }
      if (error.code === '23505') {
        throw new Error('Track is already in this playlist');
      }
      throw error;
    }

    setPlaylists(prev => prev.map(p => 
      p.id === playlistId 
        ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: new Date() }
        : p
    ));
  }, [playlists, user]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) throw error;

    setPlaylists(prev => prev.map(p => 
      p.id === playlistId 
        ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId), updatedAt: new Date() }
        : p
    ));
  }, []);

  const getPlaylistTracks = useCallback((playlistId: string, preserveOrder: boolean = true): Track[] => {
    // Look for playlist in both owned and shared playlists
    const playlist = playlists.find(p => p.id === playlistId) || 
                    sharedPlaylists.find(p => p.id === playlistId);
    
    if (!playlist) return [];

    if (preserveOrder) {
      // Return tracks in playlist's saved order (for manual mode)
      const playlistTracks = playlist.trackIds
        .map(id => tracks.find(t => t.id === id))
        .filter((t): t is Track => t !== undefined);
      return playlistTracks;
    } else {
      // Return tracks without forcing order (for sorting)
      return tracks.filter(t => playlist.trackIds.includes(t.id));
    }
  }, [playlists, sharedPlaylists, tracks]);
  
  const reorderPlaylistTracks = useCallback(async (playlistId: string, orderedTrackIds: string[]) => {
    if (!user) throw new Error('You must be logged in to reorder playlists');
    
    try {
      // Update positions in database
      const positions = orderedTrackIds.map((trackId, index) => ({
        track_id: trackId,
        position: index
      }));
      
      const { error } = await supabase.rpc('update_track_positions', {
        p_table_name: 'playlist_tracks',
        p_parent_id: playlistId,
        p_positions: positions
      });
      
      if (error) throw error;
      
      // Update local state
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId 
          ? { ...p, trackIds: orderedTrackIds, updatedAt: new Date() }
          : p
      ));
    } catch (error) {
      console.error('Error reordering tracks:', error);
      throw error;
    }
  }, [user]);
  
  const reorderCollectionTracks = useCallback(async (collectionName: string, orderedTrackIds: string[]) => {
    if (!user) throw new Error('You must be logged in to reorder collections');
    
    try {
      const { error } = await supabase.rpc('update_collection_track_order', {
        p_collection_name: collectionName,
        p_track_order: orderedTrackIds
      });
      
      if (error) throw error;
      
      // Update cache immediately
      collectionOrderCacheRef.current[collectionName] = orderedTrackIds;
    } catch (error) {
      console.error('Error reordering collection tracks:', error);
      throw error;
    }
  }, [user]);
  
  const getCollectionTrackOrder = useCallback(async (collectionName: string): Promise<string[]> => {
    if (!user) return [];
    
    // Return cached order if available
    if (collectionOrderCacheRef.current[collectionName]) {
      return collectionOrderCacheRef.current[collectionName];
    }
    
    try {
      const { data, error } = await supabase.rpc('get_collection_track_order', {
        p_collection_name: collectionName
      });
      
      if (error) throw error;
      
      const order = data || [];
      // Cache the order
      collectionOrderCacheRef.current[collectionName] = order;
      return order;
    } catch (error) {
      console.error('Error getting collection track order:', error);
      return [];
    }
  }, [user]);
  
  const getDeletedTracks = useCallback(async (): Promise<Track[]> => {
    if (!user) return [];
    
    try {
      // Query tracks table directly for deleted tracks
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          user_id,
          name,
          file_name,
          file_size,
          storage_path,
          duration,
          category,
          tags,
          artist,
          collection,
          tempo,
          key,
          time_signature,
          genre,
          mood,
          notes,
          listened,
          liked,
          loved,
          primary_track_id,
          deleted_at,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', thirtyDaysAgo.toISOString())
        .order('deleted_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(track => ({
        ...track,
        url: '', // Will be generated on demand
        uploadedAt: new Date(track.created_at),
        tags: track.tags || []
      }));
    } catch (error) {
      console.error('Error loading deleted tracks:', error);
      return [];
    }
  }, [user]);
  
  const restoreTrack = useCallback(async (id: string) => {
    try {
      // Direct update to restore the track
      const { error } = await supabase
        .from('tracks')
        .update({ deleted_at: null })
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Reload tracks to include the restored one
      await loadTracks();
    } catch (error) {
      console.error('Error restoring track:', error);
      throw error;
    }
  }, [user]);
  
  const permanentlyDeleteTrack = useCallback(async (id: string) => {
    try {
      // First get the track to find its storage path
      const { data: trackData } = await supabase
        .from('tracks')
        .select('storage_path')
        .eq('id', id)
        .single();
      
      // Delete from storage
      if (trackData?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('audio-files')
          .remove([trackData.storage_path]);
        
        if (storageError) {
          console.error('Error deleting from storage:', storageError);
          // Continue with database deletion even if storage fails
        }
      }
      
      // Permanently delete from database
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh profile to update storage usage
      await refreshProfile();
    } catch (error) {
      console.error('Error permanently deleting track:', error);
      throw error;
    }
  }, [refreshProfile]);
  
  return (
    <LibraryContext.Provider
      value={{
        tracks,
        collections,
        playlists,
        sharedPlaylists,
        addTrack,
        removeTrack,
        updateTrack,
        addCollection,
        removeCollection,
        getTracksByCategory,
        searchTracks,
        getTracksByTag,
        getAllUsedTags,
        refreshTracks: loadTracks,
        // Playlist methods
        createPlaylist,
        deletePlaylist,
        updatePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        getPlaylistTracks,
        reorderPlaylistTracks,
        reorderCollectionTracks,
        getCollectionTrackOrder,
        // Soft delete methods
        getDeletedTracks,
        restoreTrack,
        permanentlyDeleteTrack,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};