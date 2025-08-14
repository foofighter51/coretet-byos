import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Rating {
  listened: number;
  liked: number;
  loved: number;
  details: Array<{
    name: string;
    rating: string;
  }>;
}

export const useTrackRatings = (trackIds: string[], playlistId?: string) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trackIds.length === 0 || !user) {
      setRatings({});
      return;
    }

    loadRatings();
  }, [trackIds.join(','), playlistId, user?.id]);

  const loadRatings = async () => {
    setLoading(true);
    
    try {
      const ratingsByTrack: Record<string, Rating> = {};
      
      // Initialize empty ratings for all tracks
      trackIds.forEach(trackId => {
        ratingsByTrack[trackId] = {
          listened: 0,
          liked: 0,
          loved: 0,
          details: []
        };
      });

      if (playlistId) {
        // Get playlist track ratings
        // First get the playlist_track records
        const { data: playlistTracks } = await supabase
          .from('playlist_tracks')
          .select('id, track_id')
          .eq('playlist_id', playlistId)
          .in('track_id', trackIds);

        if (playlistTracks && playlistTracks.length > 0) {
          const playlistTrackIds = playlistTracks.map(pt => pt.id);
          
          // Get ratings for these playlist tracks
          const { data: ratings } = await supabase
            .from('playlist_track_ratings')
            .select(`
              playlist_track_id,
              rating,
              user_id,
              profiles!user_id(email)
            `)
            .in('playlist_track_id', playlistTrackIds);

          if (ratings) {
            // Map ratings back to tracks
            ratings.forEach(rating => {
              const playlistTrack = playlistTracks.find(pt => pt.id === rating.playlist_track_id);
              if (playlistTrack) {
                const trackId = playlistTrack.track_id;
                if (ratingsByTrack[trackId]) {
                  // Count rating types
                  if (rating.rating === 'listened') ratingsByTrack[trackId].listened++;
                  if (rating.rating === 'liked') ratingsByTrack[trackId].liked++;
                  if (rating.rating === 'loved') ratingsByTrack[trackId].loved++;
                  
                  // Add to details
                  ratingsByTrack[trackId].details.push({
                    name: rating.profiles?.email || 'Unknown',
                    rating: rating.rating
                  });
                }
              }
            });
          }
        }
      } else {
        // Get personal track ratings
        const { data: ratings } = await supabase
          .from('personal_track_ratings')
          .select('track_id, rating')
          .in('track_id', trackIds)
          .eq('user_id', user!.id);

        if (ratings) {
          ratings.forEach(rating => {
            if (ratingsByTrack[rating.track_id]) {
              if (rating.rating === 'listened') ratingsByTrack[rating.track_id].listened = 1;
              if (rating.rating === 'liked') ratingsByTrack[rating.track_id].liked = 1;
              if (rating.rating === 'loved') ratingsByTrack[rating.track_id].loved = 1;
            }
          });
        }
      }

      setRatings(ratingsByTrack);
    } catch (error) {
      console.error('Error in useTrackRatings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { ratings, loading, refetch: loadRatings };
};