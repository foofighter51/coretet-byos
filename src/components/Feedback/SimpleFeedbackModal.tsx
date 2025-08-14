import React, { useState } from 'react';
import { X, Send, MessageSquare, Paperclip, FileText, Image, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface SimpleFeedbackModalProps {
  onClose: () => void;
}

interface AttachmentFile {
  file: File;
  preview?: string;
}

const SimpleFeedbackModal: React.FC<SimpleFeedbackModalProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Process files (shared between file input and drag-drop)
  const processFiles = (files: File[]) => {
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

  // Handle file selection from input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
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
      const fileName = `${user?.id}/${Date.now()}-${file.name}`;
      
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
      
      // Get the session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
      }

      // Call the edge function to send feedback
      const { data, error: functionError } = await supabase.functions.invoke('send-feedback', {
        body: { 
          topic, 
          comment,
          userEmail: profile?.email || user?.email || 'Unknown',
          userId: user?.id || 'Unknown',
          attachments: attachmentUrls
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw functionError;
      }

      setSubmitted(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // If edge function fails, try to at least save to database
      try {
        await supabase
          .from('feedback')
          .insert({
            user_id: user?.id,
            topic,
            comment,
          });
        
        setError('Email could not be sent, but your feedback was saved. We\'ll review it soon.');
        setTimeout(() => {
          onClose();
        }, 3000);
      } catch (dbError) {
        setError('Failed to send feedback. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-forest-main rounded-xl p-8 max-w-md w-full mx-4 text-center animate-slide-up">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent-yellow/20 flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-accent-yellow" />
          </div>
          <h3 className="font-anton text-xl text-silver mb-2">Thank You!</h3>
          <p className="font-quicksand text-silver/80">
            Your feedback has been sent successfully!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-forest-main rounded-xl p-6 max-w-md w-full mx-4 animate-slide-up">
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
              maxLength={100}
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
              maxLength={2000}
            />
            <p className="mt-1 font-quicksand text-xs text-silver/40 text-right">
              {comment.length}/2000
            </p>
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Attachments (optional)
            </label>
            
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
                isDragging 
                  ? 'border-accent-yellow bg-accent-yellow/10' 
                  : 'border-forest-light hover:border-silver/40'
              } ${attachments.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.txt"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={attachments.length >= 5}
              />
              
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className={`p-3 rounded-full ${isDragging ? 'bg-accent-yellow/20' : 'bg-forest-light'}`}>
                  <Paperclip className={`w-6 h-6 ${isDragging ? 'text-accent-yellow' : 'text-silver/60'}`} />
                </div>
                <div className="text-center">
                  <p className="font-quicksand text-sm text-silver">
                    {attachments.length >= 5 
                      ? 'Maximum 5 attachments reached' 
                      : isDragging
                        ? 'Drop files here'
                        : 'Drag and drop files here'}
                  </p>
                  {attachments.length < 5 && !isDragging && (
                    <p className="font-quicksand text-xs text-silver/60 mt-1">
                      or click to browse
                    </p>
                  )}
                </div>
              </div>
            </div>

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

          <div className="bg-forest-light/50 rounded-lg p-3">
            <p className="font-quicksand text-xs text-silver/60">
              Your feedback will be sent directly to coretetapp@gmail.com
            </p>
          </div>

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
              <span>{isSubmitting ? 'Processing...' : 'Send Feedback'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleFeedbackModal;