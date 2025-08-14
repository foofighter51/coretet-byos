import React, { useState } from 'react';
import { MessageSquare, Send, Edit2, Trash2, X, Check, Users } from 'lucide-react';
import { useTrackComments } from '../../hooks/useTrackComments';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface TrackCommentsProps {
  trackId: string;
  playlistId: string;
  playlistName?: string;
  isSharedPlaylist?: boolean;
}

const TrackComments: React.FC<TrackCommentsProps> = ({ 
  trackId, 
  playlistId, 
  playlistName,
  isSharedPlaylist 
}) => {
  const { user } = useAuth();
  const { comments, loading, error, addComment, updateComment, deleteComment } = useTrackComments(trackId, playlistId);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(newComment);
      setNewComment('');
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (commentId: string, currentContent: string) => {
    setEditingId(commentId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingId) return;

    try {
      await updateComment(editingId, editContent);
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId);
      } catch (err) {
        // Error is handled by the hook
      }
    }
  };

  return (
    <div className="bg-forest-light/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-accent-yellow" />
        <h3 className="font-anton text-sm text-silver">
          Comments
          {isSharedPlaylist && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-accent-coral font-quicksand">
              <Users className="w-3 h-3" />
              Shared Playlist
            </span>
          )}
        </h3>
        {comments.length > 0 && (
          <span className="text-xs text-silver/60 font-quicksand">
            ({comments.length})
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isSharedPlaylist ? "Add a comment (visible to all users with access)" : "Add a comment..."}
            className="flex-1 bg-forest-main border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            disabled={isSubmitting || loading}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="p-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4">
          <p className="text-xs text-silver/60">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => {
            const isOwn = user?.id === comment.userId;
            const isEditing = editingId === comment.id;

            return (
              <div
                key={comment.id}
                className={`bg-forest-main rounded-lg p-3 ${
                  isOwn ? 'border border-accent-yellow/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-quicksand text-xs font-medium text-accent-yellow">
                      {comment.userName || comment.userEmail?.split('@')[0] || 'Anonymous'}
                    </span>
                    <span className="font-quicksand text-xs text-silver/40">
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  {isOwn && !isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(comment.id, comment.content)}
                        className="p-1 hover:bg-forest-light rounded transition-colors"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3 h-3 text-silver/60 hover:text-accent-yellow" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 hover:bg-forest-light rounded transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3 text-silver/60 hover:text-red-400" />
                      </button>
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 hover:bg-forest-light rounded transition-colors"
                        title="Save"
                      >
                        <Check className="w-3 h-3 text-green-400" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 hover:bg-forest-light rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                    autoFocus
                    maxLength={2000}
                  />
                ) : (
                  <p className="font-quicksand text-sm text-silver">
                    {comment.content}
                  </p>
                )}
                {comment.updatedAt > comment.createdAt && !isEditing && (
                  <p className="font-quicksand text-xs text-silver/40 mt-1">
                    (edited)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-silver/60">
            {isSharedPlaylist 
              ? "No comments yet. Be the first to start a discussion!"
              : "No comments yet"}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackComments;