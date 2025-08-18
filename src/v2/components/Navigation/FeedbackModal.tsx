import React, { useState, useRef } from 'react';

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [topic, setTopic] = useState('');
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement feedback submission
    console.log('Feedback submitted:', { topic, comment, attachments });
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments(prev => [...prev, ...files]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-forest-main border border-forest-light/30 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-forest-light/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-yellow rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-forest-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-white font-anton text-xl">Beta Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-silver/70 font-quicksand text-sm mb-6">
            We'd love to hear your thoughts! Your feedback helps us improve CoreTet.
          </p>

          {/* Topic */}
          <div className="mb-4">
            <label className="block text-silver font-quicksand text-sm mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Feature request, Bug report, General feedback..."
              className="w-full bg-forest-light/50 text-silver placeholder-silver/50 border border-forest-light/30 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-yellow/50 focus:bg-forest-light/70 transition-colors font-quicksand text-sm"
            />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-silver font-quicksand text-sm mb-2">Your Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts, suggestions, or report issues..."
              rows={6}
              className="w-full bg-forest-light/50 text-silver placeholder-silver/50 border border-forest-light/30 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-yellow/50 focus:bg-forest-light/70 transition-colors font-quicksand text-sm resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className="text-silver/40 text-xs font-quicksand">{comment.length}/2000</span>
            </div>
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <label className="block text-silver font-quicksand text-sm mb-2">Attachments (optional)</label>
            
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-forest-light/30 rounded-lg p-6 text-center cursor-pointer hover:border-forest-light/50 transition-colors"
            >
              <svg className="w-8 h-8 text-silver/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <p className="text-silver/60 font-quicksand text-sm">
                Drag and drop files here<br />
                <span className="text-silver/40">or click to browse</span>
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-forest-light/30 rounded px-3 py-2">
                    <span className="text-silver font-quicksand text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-400 hover:text-red-300 transition-colors ml-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-forest-light/30 pt-4">
            <p className="text-silver/50 font-quicksand text-xs mb-4">
              Your feedback will be sent directly to coretetapp@gmail.com
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-silver/60 hover:text-silver transition-colors font-quicksand text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 bg-accent-yellow text-forest-dark px-4 py-2 rounded-lg font-quicksand font-semibold hover:bg-accent-yellow/90 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Feedback</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}