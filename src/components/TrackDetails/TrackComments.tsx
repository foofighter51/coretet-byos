import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Track } from '../../types';

interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  avatar_url?: string;
}

interface TrackCommentsProps {
  track: Track;
}

const TrackComments: React.FC<TrackCommentsProps> = ({ track }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // Subscribe to new comments
    const channel = supabase
      .channel(`track-comments-${track.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_comments',
          filter: `track_id=eq.${track.id}`,
        },
        (payload) => {
          fetchComments(); // Refetch to get user info
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [track.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('track_comments')
        .select(`
          *,
          public_profiles:user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('track_id', track.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Comments table not ready:', error);
        // Fallback to simpler query if join fails
        const { data: fallbackData } = await supabase
          .from('track_comments')
          .select('*')
          .eq('track_id', track.id)
          .order('created_at', { ascending: false });
        
        const formattedComments = (fallbackData || []).map(comment => ({
          ...comment,
          user_name: 'User',
        }));
        setComments(formattedComments);
        return;
      }

      const formattedComments = (data || []).map(comment => {
        // Use display_name, fallback to username, then to email prefix
        const displayName = comment.public_profiles?.display_name || 
                          comment.public_profiles?.username || 
                          'Anonymous';
        
        return {
          ...comment,
          user_name: displayName,
          avatar_url: comment.public_profiles?.avatar_url,
        };
      });

      setComments(formattedComments);
    } catch (err) {
      console.log('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('track_comments')
        .insert({
          track_id: track.id,
          user_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!user || user.id !== commentUserId) return;

    try {
      const { error } = await supabase
        .from('track_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="flex-1 border-2 border-accent-yellow rounded-lg p-4">
      <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">Comments</h3>
      
      {/* Comments list */}
      <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
        {loading ? (
          <p className="text-silver/60 text-sm">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-silver/60 text-sm">No comments yet</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-forest-light/50 rounded-lg p-2.5 group">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  {comment.avatar_url && (
                    <img 
                      src={comment.avatar_url} 
                      alt={comment.user_name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="font-quicksand text-xs font-medium text-silver">
                    {comment.user_name}
                  </span>
                  <span className="font-quicksand text-xs text-silver/40">
                    {formatTimestamp(comment.created_at)}
                  </span>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-silver/40 hover:text-accent-coral p-0.5"
                    title="Delete comment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="font-quicksand text-sm text-silver">
                {comment.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
          placeholder="Add a comment..."
          disabled={submitting}
          className="flex-1 bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
        />
        <button
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
          className="p-1.5 bg-accent-yellow text-forest-dark rounded hover:bg-accent-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send comment"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TrackComments;