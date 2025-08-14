import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../contexts/ProjectContext';

interface CreateWorkModalProps {
  onClose: () => void;
}

/**
 * CreateWorkModal - Simple modal for creating a new work
 * Just asks for title (required) and artist (optional)
 */
export default function CreateWorkModal({ onClose }: CreateWorkModalProps) {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title for your work');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create the work (using existing project structure for now)
      const work = await createProject({
        name: title.trim(),
        artist: artist.trim() || undefined,
        project_type: 'single' // Default to single type for works
      });

      // Navigate to the work view
      navigate(`/work/${work.id}`);
      onClose();
    } catch (err) {
      console.error('Error creating work:', err);
      setError('Failed to create work. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-forest-main border border-forest-light rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-forest-light">
          <h2 className="font-anton text-2xl text-silver">Create a Work</h2>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title Field */}
          <div>
            <label className="block font-quicksand text-sm text-silver mb-2">
              Title <span className="text-accent-coral">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your song title..."
              className="w-full px-4 py-3 bg-forest-dark border border-forest-light rounded-lg font-quicksand text-silver placeholder:text-silver/40 focus:outline-none focus:border-accent-yellow transition-colors"
              autoFocus
            />
          </div>

          {/* Artist Field (Optional) */}
          <div>
            <label className="block font-quicksand text-sm text-silver mb-2">
              Artist <span className="text-silver/40">(optional)</span>
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist or band name..."
              className="w-full px-4 py-3 bg-forest-dark border border-forest-light rounded-lg font-quicksand text-silver placeholder:text-silver/40 focus:outline-none focus:border-accent-yellow transition-colors"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="font-quicksand text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 font-quicksand text-silver/60 hover:text-silver transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="px-6 py-2 bg-accent-yellow text-forest-dark font-quicksand font-semibold rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}