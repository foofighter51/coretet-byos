import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Heart, ThumbsUp, Headphones, Users } from 'lucide-react';
import { useCollaborator } from '../../contexts/CollaboratorContext';
import { supabase } from '../../lib/supabase';
import { Track } from '../../types';

interface PlaylistTrack extends Track {
  ratings?: {
    listened: number;
    liked: number;
    loved: number;
    myRating?: 'listened' | 'liked' | 'loved' | null;
    details: Array<{
      name: string;
      rating: string;
      rated_at: string;
    }>;
  };
}

interface PlaylistInfo {
  id: string;
  name: string;
  description?: string;
  owner: {
    email: string;
  };
}

const CollaboratorPlaylistView: React.FC = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { collaborator } = useCollaborator();
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [ratingTrack, setRatingTrack] = useState<string | null>(null);

  useEffect(() => {
    if (!collaborator) {
      navigate('/collaborate');
      return;
    }
    
    if (playlistId) {
      loadPlaylistData();
    }
  }, [playlistId, collaborator]);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const loadPlaylistData = async () => {
    if (!playlistId || !collaborator) return;

    try {
      // Load playlist info
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          profiles!playlists_user_id_fkey(email)
        `)
        .eq('id', playlistId)
        .single();

      if (playlistError) throw playlistError;

      setPlaylist({
        ...playlistData,
        owner: playlistData.profiles,
      });

      // Load tracks with their order
      const { data: playlistTracks, error: tracksError } = await supabase
        .from('playlist_tracks')
        .select(`
          position,
          tracks!inner(*)
        `)
        .eq('playlist_id', playlistId)
        .order('position');

      if (tracksError) throw tracksError;

      // Load ratings for all tracks
      const trackIds = playlistTracks.map(pt => pt.tracks.id);
      const tracksWithRatings = await Promise.all(
        playlistTracks.map(async (pt) => {
          const track = pt.tracks;
          
          // Get all ratings for this track in this playlist
          const { data: ratings, error: ratingsError } = await supabase
            .from('track_ratings')
            .select(`
              rating,
              collaborators!inner(name),
              rated_at
            `)
            .eq('track_id', track.id)
            .eq('playlist_id', playlistId);

          if (ratingsError) {
            console.error('Error loading ratings:', ratingsError);
          }

          // Calculate rating counts and find my rating
          const ratingCounts = {
            listened: 0,
            liked: 0,
            loved: 0,
            myRating: null as string | null,
            details: [] as any[],
          };

          (ratings || []).forEach((r) => {
            ratingCounts[r.rating as keyof typeof ratingCounts]++;
            ratingCounts.details.push({
              name: r.collaborators.name,
              rating: r.rating,
              rated_at: r.rated_at,
            });
            
            // Check if this is my rating
            if (r.collaborators.id === collaborator.id) {
              ratingCounts.myRating = r.rating;
            }
          });

          return {
            ...track,
            ratings: ratingCounts,
          };
        })
      );

      setTracks(tracksWithRatings);
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async (track: PlaylistTrack) => {
    if (!track.storage_path) return;

    if (playingTrack === track.id) {
      // Pause current track
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingTrack(null);
    } else {
      // Play new track
      try {
        // Get signed URL for audio file
        const { data: signedUrlData, error } = await supabase.storage
          .from('audio-files')
          .createSignedUrl(track.storage_path, 3600); // 1 hour expiry

        if (error || !signedUrlData?.signedUrl) {
          console.error('Failed to get signed URL:', error);
          return;
        }

        // Stop current audio if playing
        if (audioElement) {
          audioElement.pause();
        }

        // Create new audio element
        const audio = new Audio(signedUrlData.signedUrl);
        audio.addEventListener('ended', () => {
          setPlayingTrack(null);
        });
        
        await audio.play();
        setAudioElement(audio);
        setPlayingTrack(track.id);
      } catch (error) {
        console.error('Error playing track:', error);
      }
    }
  };

  const handleRate = async (trackId: string, rating: 'listened' | 'liked' | 'loved') => {
    if (!collaborator || !playlistId) return;

    setRatingTrack(trackId);
    
    try {
      // Get collaborator token for auth
      const token = localStorage.getItem('coretet_collaborator_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      // Check if already rated
      const track = tracks.find(t => t.id === trackId);
      const currentRating = track?.ratings?.myRating;

      if (currentRating === rating) {
        // Remove rating
        const { error } = await supabase
          .from('track_ratings')
          .delete()
          .eq('track_id', trackId)
          .eq('playlist_id', playlistId)
          .eq('collaborator_id', collaborator.id);

        if (error) throw error;
      } else {
        // Add/update rating
        const { error } = await supabase
          .from('track_ratings')
          .upsert({
            track_id: trackId,
            playlist_id: playlistId,
            collaborator_id: collaborator.id,
            rating,
          }, {
            onConflict: 'track_id,playlist_id,collaborator_id',
          });

        if (error) throw error;
      }

      // Reload ratings
      await loadPlaylistData();
    } catch (error) {
      console.error('Error rating track:', error);
    } finally {
      setRatingTrack(null);
    }
  };

  const getRatingIcon = (rating: 'listened' | 'liked' | 'loved') => {
    switch (rating) {
      case 'listened': return Headphones;
      case 'liked': return ThumbsUp;
      case 'loved': return Heart;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="text-silver">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="text-silver">Playlist not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-dark">
      {/* Header */}
      <header className="bg-forest-main border-b border-forest-light sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/collaborate')}
                className="text-silver hover:text-accent-yellow transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-anton text-xl text-silver">{playlist.name}</h1>
                <p className="font-quicksand text-xs text-silver/60">
                  Shared by {playlist.owner.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-silver/60">
              <Users className="w-4 h-4" />
              <span className="font-quicksand text-sm">
                {tracks.length} tracks
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Track List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {playlist.description && (
          <p className="font-quicksand text-silver/80 mb-6">
            {playlist.description}
          </p>
        )}

        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="bg-forest-main rounded-lg p-4 hover:bg-forest-main/80 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {/* Play button */}
                <button
                  onClick={() => handlePlayPause(track)}
                  className="flex-shrink-0 w-10 h-10 bg-accent-yellow/20 rounded-full flex items-center justify-center hover:bg-accent-yellow/30 transition-colors"
                >
                  {playingTrack === track.id ? (
                    <Pause className="w-5 h-5 text-accent-yellow" />
                  ) : (
                    <Play className="w-5 h-5 text-accent-yellow ml-0.5" />
                  )}
                </button>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-quicksand font-medium text-silver truncate">
                    {track.name}
                  </h3>
                  <p className="font-quicksand text-sm text-silver/60 truncate">
                    {track.artist || 'Unknown Artist'}
                  </p>
                </div>

                {/* Rating buttons */}
                <div className="flex items-center space-x-2">
                  {(['listened', 'liked', 'loved'] as const).map((rating) => {
                    const Icon = getRatingIcon(rating);
                    const count = track.ratings?.[rating] || 0;
                    const isMyRating = track.ratings?.myRating === rating;
                    const isRating = ratingTrack === track.id;
                    
                    return (
                      <button
                        key={rating}
                        onClick={() => handleRate(track.id, rating)}
                        disabled={isRating}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                          isMyRating
                            ? 'bg-accent-yellow text-forest-dark'
                            : 'bg-forest-light text-silver hover:bg-forest-light/80'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon className="w-4 h-4" />
                        {count > 0 && (
                          <span className="font-quicksand text-sm font-medium">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating details (on hover/click) */}
              {track.ratings && track.ratings.details.length > 0 && (
                <div className="mt-3 pt-3 border-t border-forest-light">
                  <div className="flex flex-wrap gap-2">
                    {track.ratings.details.map((detail, i) => {
                      const Icon = getRatingIcon(detail.rating as any);
                      return (
                        <div
                          key={i}
                          className="flex items-center space-x-1 text-xs text-silver/60"
                        >
                          <Icon className="w-3 h-3" />
                          <span className="font-quicksand">
                            {detail.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CollaboratorPlaylistView;