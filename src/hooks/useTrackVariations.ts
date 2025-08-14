import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Track } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

export function useTrackVariations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all variations of a track (including the primary)
  const getVariations = useCallback(async (trackId: string): Promise<Track[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);

      // First, check if this track is a primary or a variant
      const { data: track } = await supabase
        .from('tracks')
        .select('id, primary_track_id')
        .eq('id', trackId)
        .single();

      if (!track) return [];

      // Determine the primary track ID
      const primaryId = track.primary_track_id || track.id;

      // Get all tracks in this variation group
      const { data: variations, error: fetchError } = await supabase
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
        .or(`id.eq.${primaryId},primary_track_id.eq.${primaryId}`)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return variations || [];
    } catch (err) {
      console.error('Error fetching variations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch variations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a variation group from selected tracks
  const createVariationGroup = useCallback(async (trackIds: string[], primaryTrackId: string) => {
    if (!user || trackIds.length < 2) return false;

    try {
      setLoading(true);
      setError(null);

      // Ensure primary track is in the list
      if (!trackIds.includes(primaryTrackId)) {
        throw new Error('Primary track must be in the selected tracks');
      }

      // Update all non-primary tracks to point to the primary
      const variantIds = trackIds.filter(id => id !== primaryTrackId);
      
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ primary_track_id: primaryTrackId })
        .in('id', variantIds)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error creating variation group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create variation group');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Change the primary track in a variation group
  const changePrimaryTrack = useCallback(async (oldPrimaryId: string, newPrimaryId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      // Get all tracks in this variation group
      const { data: variants, error: fetchError } = await supabase
        .from('tracks')
        .select('id')
        .eq('primary_track_id', oldPrimaryId);

      if (fetchError) throw fetchError;

      // Begin transaction-like updates
      // 1. Remove new primary from variants
      await supabase
        .from('tracks')
        .update({ primary_track_id: null })
        .eq('id', newPrimaryId);

      // 2. Update all other variants to point to new primary
      const otherVariantIds = variants?.filter(v => v.id !== newPrimaryId).map(v => v.id) || [];
      if (otherVariantIds.length > 0) {
        await supabase
          .from('tracks')
          .update({ primary_track_id: newPrimaryId })
          .in('id', otherVariantIds);
      }

      // 3. Make old primary a variant of new primary
      await supabase
        .from('tracks')
        .update({ primary_track_id: newPrimaryId })
        .eq('id', oldPrimaryId);

      return true;
    } catch (err) {
      console.error('Error changing primary track:', err);
      setError(err instanceof Error ? err.message : 'Failed to change primary track');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Unlink a specific track from its variation group
  const unlinkVariation = useCallback(async (trackId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('tracks')
        .update({ primary_track_id: null })
        .eq('id', trackId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error unlinking variation:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlink variation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Unlink all variations from a primary track
  const unlinkAllVariations = useCallback(async (primaryTrackId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('tracks')
        .update({ primary_track_id: null })
        .eq('primary_track_id', primaryTrackId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error unlinking all variations:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlink all variations');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    getVariations,
    createVariationGroup,
    changePrimaryTrack,
    unlinkVariation,
    unlinkAllVariations
  };
}