import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TrackComment } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useTrackComments = (trackId: string | null, playlistId: string | null) => {
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load comments for a track in a playlist
  const loadComments = useCallback(async () => {
    if (!trackId || !playlistId) {
      setComments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('track_comments_with_users')
        .select('*')
        .eq('track_id', trackId)
        .eq('playlist_id', playlistId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedComments: TrackComment[] = (data || []).map(comment => ({
        id: comment.id,
        trackId: comment.track_id,
        playlistId: comment.playlist_id,
        userId: comment.user_id,
        userEmail: comment.user_email,
        userName: comment.user_name,
        content: comment.content,
        createdAt: new Date(comment.created_at),
        updatedAt: new Date(comment.updated_at),
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [trackId, playlistId]);

  // Add a new comment
  const addComment = useCallback(async (content: string) => {
    if (!user || !trackId || !playlistId || !content.trim()) {
      return;
    }

    setError(null);

    try {
      const { data, error } = await supabase
        .from('track_comments')
        .insert({
          track_id: trackId,
          playlist_id: playlistId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Reload comments to get the full user info
      await loadComments();
      
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    }
  }, [user, trackId, playlistId, loadComments]);

  // Update a comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    if (!user || !content.trim()) {
      return;
    }

    setError(null);

    try {
      const { error } = await supabase
        .from('track_comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only update their own comments

      if (error) throw error;

      // Reload comments
      await loadComments();
    } catch (err) {
      console.error('Error updating comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    }
  }, [user, loadComments]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) {
      return;
    }

    setError(null);

    try {
      const { error } = await supabase
        .from('track_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;

      // Remove from local state immediately
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    }
  }, [user]);

  // Load comments when track or playlist changes
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Set up real-time subscription for comments
  useEffect(() => {
    if (!trackId || !playlistId) return;

    const channel = supabase
      .channel(`comments:${trackId}:${playlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'track_comments',
          filter: `track_id=eq.${trackId},playlist_id=eq.${playlistId}`,
        },
        (payload) => {
          console.log('Comment change:', payload);
          // Reload comments on any change
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, playlistId, loadComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refreshComments: loadComments,
  };
};