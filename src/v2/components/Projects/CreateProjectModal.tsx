import React, { useState } from 'react';
import { X, Music, Calendar, FileText, Loader } from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';
import { CreateProjectInput, ProjectType } from '../../types/project.types';
import { useNavigate } from 'react-router-dom';

interface CreateProjectModalProps {
  onClose: () => void;
}

/**
 * CreateProjectModal - Form for creating new projects
 */
export default function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    project_type: 'album',
    target_release_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const project = await createProject(formData);
      onClose();
      // Navigate to the new project
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setLoading(false);
    }
  };

  const projectTypes: { value: ProjectType; label: string; icon: string }[] = [
    { value: 'album', label: 'Album', icon: '💿' },
    { value: 'ep', label: 'EP', icon: '🎵' },
    { value: 'single', label: 'Single', icon: '🎶' },
    { value: 'collection', label: 'Collection', icon: '📂' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-forest-main rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-forest-light">
          <h2 className="font-anton text-2xl text-silver">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="font-quicksand text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Awesome Album"
              className="w-full bg-forest-light border border-forest-light rounded-lg px-4 py-3 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow transition-colors"
              disabled={loading}
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Project Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {projectTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, project_type: type.value }))}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all ${
                    formData.project_type === type.value
                      ? 'bg-accent-yellow/20 border-accent-yellow text-silver'
                      : 'bg-forest-light border-forest-light text-silver/60 hover:border-silver/40'
                  }`}
                  disabled={loading}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="font-quicksand font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this project about?"
              rows={3}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-4 py-3 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow transition-colors resize-none"
              disabled={loading}
            />
          </div>

          {/* Target Release Date */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Target Release Date
            </label>
            <input
              type="date"
              value={formData.target_release_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, target_release_date: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-4 py-3 font-quicksand text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow transition-colors"
              disabled={loading}
            />
            <p className="font-quicksand text-xs text-silver/40 mt-1">
              Optional - Set a goal for when you want to release this project
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-forest-light">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex items-center space-x-2 px-6 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}