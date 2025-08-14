import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type RatingType = 'listened' | 'liked' | 'loved';

interface RatingData {
  personalRating?: RatingType;
  playlistRating?: RatingType;
  playlistRatingSummary?: {
    listened: number;
    liked: number;
    loved: number;
    total: number;
  };
}

export function useTrackRating(trackId: string, playlistId?: string) {
  const { user } = useAuth();
  const [rating, setRating] = useState<RatingData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !trackId) return;
    loadRatings();
  }, [user, trackId, playlistId]);

  const loadRatings = async () => {
    try {
      // Load personal rating
      const { data: personalData } = await supabase
        .from('personal_track_ratings')
        .select('rating')
        .eq('user_id', user!.id)
        .eq('track_id', trackId)
        .single();

      // Load playlist rating if in a playlist context
      let playlistRatingData = null;
      let playlistSummary = null;

      if (playlistId) {
        // Get playlist_track_id
        const { data: playlistTrack } = await supabase
          .from('playlist_tracks')
          .select('id')
          .eq('playlist_id', playlistId)
          .eq('track_id', trackId)
          .single();

        if (playlistTrack) {
          // Get user's rating for this playlist track
          const { data: playlistRating } = await supabase
            .from('playlist_track_ratings')
            .select('rating')
            .eq('user_id', user!.id)
            .eq('playlist_track_id', playlistTrack.id)
            .single();

          playlistRatingData = playlistRating;

          // Get rating summary
          const { data: summary } = await supabase
            .from('playlist_track_rating_summary')
            .select('*')
            .eq('playlist_track_id', playlistTrack.id)
            .single();

          if (summary) {
            playlistSummary = {
              listened: summary.listened_count,
              liked: summary.liked_count,
              loved: summary.loved_count,
              total: summary.total_ratings
            };
          }
        }
      }

      setRating({
        personalRating: personalData?.rating as RatingType | undefined,
        playlistRating: playlistRatingData?.rating as RatingType | undefined,
        playlistRatingSummary: playlistSummary || undefined
      });
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePersonalRating = async (newRating: RatingType | null) => {
    if (!user || !trackId) return;

    try {
      if (newRating === null || rating.personalRating === newRating) {
        // Remove rating
        await supabase
          .from('personal_track_ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);
        
        setRating(prev => ({ ...prev, personalRating: undefined }));
      } else {
        // Upsert rating
        await supabase
          .from('personal_track_ratings')
          .upsert({
            user_id: user.id,
            track_id: trackId,
            rating: newRating,
            updated_at: new Date().toISOString()
          });
        
        setRating(prev => ({ ...prev, personalRating: newRating }));
      }
    } catch (error) {
      console.error('Error updating personal rating:', error);
    }
  };

  const updatePlaylistRating = async (newRating: RatingType | null) => {
    if (!user || !trackId || !playlistId) return;

    try {
      // Get playlist_track_id
      const { data: playlistTrack } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId)
        .single();

      if (!playlistTrack) return;

      if (newRating === null || rating.playlistRating === newRating) {
        // Remove rating
        await supabase
          .from('playlist_track_ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('playlist_track_id', playlistTrack.id);
        
        setRating(prev => ({ ...prev, playlistRating: undefined }));
      } else {
        // Upsert rating
        await supabase
          .from('playlist_track_ratings')
          .upsert({
            user_id: user.id,
            playlist_track_id: playlistTrack.id,
            rating: newRating,
            updated_at: new Date().toISOString()
          });
        
        setRating(prev => ({ ...prev, playlistRating: newRating }));
      }

      // Reload to get updated summary
      loadRatings();
    } catch (error) {
      console.error('Error updating playlist rating:', error);
    }
  };

  return {
    ...rating,
    loading,
    updatePersonalRating,
    updatePlaylistRating
  };
}