import React, { useState } from 'react';
import { X, Send, MessageSquare, Paperclip, FileText, Image, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface FeedbackModalProps {
  onClose: () => void;
}

interface AttachmentFile {
  file: File;
  preview?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/plain'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        showToast(`${file.name} is too large. Maximum size is 10MB.`, 'error');
        return false;
      }
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        showToast(`${file.name} is not a supported file type.`, 'error');
        return false;
      }
      return true;
    });

    const newAttachments = validFiles.map(file => {
      const attachment: AttachmentFile = { file };
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }
      
      return attachment;
    });

    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5)); // Max 5 attachments
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Upload attachments to Supabase Storage
  const uploadAttachments = async () => {
    if (attachments.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const { file } of attachments) {
      const fileName = `feedback/${user?.id}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('feedback-attachments')
        .upload(fileName, file);
      
      if (error) {
        console.error('Error uploading file:', error);
        showToast(`Failed to upload ${file.name}`, 'error');
        continue;
      }
      
      const { data: urlData } = supabase.storage
        .from('feedback-attachments')
        .getPublicUrl(fileName);
      
      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim() || !comment.trim()) {
      setError('Please fill in both topic and comment fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload attachments first
      const attachmentUrls = await uploadAttachments();
      
      // Call the edge function to send feedback
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('send-feedback', {
        body: { 
          topic, 
          comment,
          attachments: attachmentUrls,
          userEmail: user?.email,
          userId: user?.id
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      setSubmitted(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-forest-main rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent-yellow/20 flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-accent-yellow" />
          </div>
          <h3 className="font-anton text-xl text-silver mb-2">Thank You!</h3>
          <p className="font-quicksand text-silver/80">
            Your feedback has been sent successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-forest-main rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-accent-yellow" />
            <h3 className="font-anton text-lg text-silver">Beta Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="font-quicksand text-sm text-silver/80">
            We'd love to hear your thoughts! Your feedback helps us improve CoreTet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder="e.g., Feature request, Bug report, General feedback..."
              required
            />
          </div>

          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Your Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow resize-none"
              placeholder="Share your thoughts, suggestions, or report issues..."
              required
            />
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Attachments (optional)
            </label>
            
            {/* File Input */}
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={attachments.length >= 5}
              />
              <div className="flex items-center space-x-2 px-3 py-2 bg-forest-light hover:bg-forest-light/80 border border-forest-light rounded-lg transition-colors">
                <Paperclip className="w-4 h-4 text-silver/60" />
                <span className="font-quicksand text-sm text-silver/80">
                  {attachments.length >= 5 
                    ? 'Maximum 5 attachments' 
                    : 'Add screenshots, logs, or documents'}
                </span>
              </div>
            </label>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-forest-light/50 rounded-lg">
                    {/* Preview or Icon */}
                    {attachment.preview ? (
                      <img 
                        src={attachment.preview} 
                        alt={attachment.file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-forest-light rounded flex items-center justify-center">
                        <FileText className="w-5 h-5 text-silver/60" />
                      </div>
                    )}
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-quicksand text-sm text-silver truncate">
                        {attachment.file.name}
                      </p>
                      <p className="font-quicksand text-xs text-silver/60">
                        {(attachment.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-1 hover:bg-forest-light rounded transition-colors"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4 text-silver/60 hover:text-accent-coral" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-accent-coral/10 border border-accent-coral/20 rounded-lg">
              <p className="font-quicksand text-sm text-accent-coral">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send Feedback'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;