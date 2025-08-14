import React, { useState, useEffect } from 'react';
import { MessageSquare, Tag, Star, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Track } from '../../types';

interface PlaylistFeedback {
  id: string;
  playlist_id: string;
  track_id: string;
  user_id: string;
  user_email?: string;
  rating?: 'listened' | 'liked' | 'loved';
  tags?: string[];
  comment?: string;
  created_at: string;
  updated_at: string;
}

interface PlaylistFeedbackProps {
  track: Track;
}

const PlaylistFeedback: React.FC<PlaylistFeedbackProps> = ({ track }) => {
  const [feedback, setFeedback] = useState<PlaylistFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPlaylistFeedback();
  }, [track.id]);

  const fetchPlaylistFeedback = async () => {
    try {
      setLoading(true);
      
      // Get all playlist feedback for this track
      const { data: playlistTracks } = await supabase
        .from('playlist_tracks')
        .select(`
          playlist_id,
          playlists (
            name,
            user_id
          ),
          playlist_track_ratings (
            user_id,
            rating,
            created_at,
            profiles (email)
          )
        `)
        .eq('track_id', track.id);

      // Get comments and tags from playlist activity
      const { data: trackComments } = await supabase
        .from('track_comments')
        .select(`
          id,
          user_id,
          comment,
          tags,
          playlist_id,
          created_at,
          profiles (email)
        `)
        .eq('track_id', track.id)
        .order('created_at', { ascending: false });

      // Combine and format feedback
      const formattedFeedback: PlaylistFeedback[] = [];
      
      // Add ratings from playlists
      playlistTracks?.forEach(pt => {
        pt.playlist_track_ratings?.forEach((rating: any) => {
          formattedFeedback.push({
            id: `rating-${pt.playlist_id}-${rating.user_id}`,
            playlist_id: pt.playlist_id,
            track_id: track.id,
            user_id: rating.user_id,
            user_email: rating.profiles?.email,
            rating: rating.rating,
            created_at: rating.created_at,
            updated_at: rating.created_at,
          });
        });
      });

      // Add comments and tags
      trackComments?.forEach(comment => {
        formattedFeedback.push({
          id: comment.id,
          playlist_id: comment.playlist_id,
          track_id: track.id,
          user_id: comment.user_id,
          user_email: comment.profiles?.email,
          comment: comment.comment,
          tags: comment.tags,
          created_at: comment.created_at,
          updated_at: comment.created_at,
        });
      });

      setFeedback(formattedFeedback);
    } catch (error) {
      console.error('Error fetching playlist feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'loved': return '❤️';
      case 'liked': return '👍';
      case 'listened': return '🎧';
      default: return '📝';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'loved': return 'text-red-500';
      case 'liked': return 'text-blue-500';
      case 'listened': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  // Group feedback by type
  const ratings = feedback.filter(f => f.rating);
  const comments = feedback.filter(f => f.comment);
  const tags = feedback.filter(f => f.tags && f.tags.length > 0);

  // Aggregate rating counts
  const ratingCounts = {
    loved: ratings.filter(r => r.rating === 'loved').length,
    liked: ratings.filter(r => r.rating === 'liked').length,
    listened: ratings.filter(r => r.rating === 'listened').length,
  };

  // Aggregate all tags
  const allTags = new Map<string, number>();
  tags.forEach(f => {
    f.tags?.forEach(tag => {
      allTags.set(tag, (allTags.get(tag) || 0) + 1);
    });
  });

  if (loading) {
    return (
      <div className="bg-forest-light/30 rounded-lg p-4">
        <p className="text-silver/60 text-sm">Loading playlist feedback...</p>
      </div>
    );
  }

  return (
    <div className="bg-forest-light/30 rounded-lg">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-forest-light/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-yellow" />
          <h3 className="font-anton text-sm text-silver uppercase tracking-wider">
            Playlist Feedback
          </h3>
          {feedback.length > 0 && (
            <span className="text-xs text-silver/60 bg-forest-light px-2 py-1 rounded-full">
              {feedback.length} items
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-silver/60" />
        ) : (
          <ChevronDown className="w-5 h-5 text-silver/60" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {feedback.length === 0 ? (
            <p className="text-silver/60 text-sm text-center py-4">
              No playlist feedback yet
            </p>
          ) : (
            <>
              {/* Rating Summary */}
              {ratings.length > 0 && (
                <div className="bg-forest-dark/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-accent-yellow" />
                    <span className="text-xs text-silver/60 uppercase">Ratings</span>
                  </div>
                  <div className="flex gap-4">
                    {ratingCounts.loved > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg">❤️</span>
                        <span className="text-sm text-silver">{ratingCounts.loved}</span>
                      </div>
                    )}
                    {ratingCounts.liked > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg">👍</span>
                        <span className="text-sm text-silver">{ratingCounts.liked}</span>
                      </div>
                    )}
                    {ratingCounts.listened > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🎧</span>
                        <span className="text-sm text-silver">{ratingCounts.listened}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tag Cloud */}
              {allTags.size > 0 && (
                <div className="bg-forest-dark/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-accent-purple" />
                    <span className="text-xs text-silver/60 uppercase">Tags from Playlists</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(allTags.entries()).map(([tag, count]) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-forest-light rounded-full text-xs text-silver"
                        title={`Used ${count} time${count > 1 ? 's' : ''}`}
                      >
                        {tag}
                        {count > 1 && (
                          <span className="ml-1 text-silver/60">({count})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {comments.length > 0 && (
                <div className="bg-forest-dark/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-accent-teal" />
                    <span className="text-xs text-silver/60 uppercase">Comments</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {comments.map(comment => (
                      <div key={comment.id} className="bg-forest-light/30 rounded p-2">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs text-silver/60">
                            {comment.user_email?.split('@')[0] || 'Anonymous'}
                          </span>
                          <span className="text-xs text-silver/40">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-silver">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistFeedback;