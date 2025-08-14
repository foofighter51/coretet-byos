import React, { useEffect } from 'react';
import { Plus, Music, Users, Calendar, Loader } from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';
import { formatDistanceToNow } from 'date-fns';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';

/**
 * ProjectList - Main view showing all user's projects
 * Displays as a grid of cards with create button
 */
export default function ProjectList() {
  const { 
    projects, 
    loading, 
    error, 
    fetchProjects 
  } = useProjects();
  
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Loading state
  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-accent-yellow animate-spin mx-auto mb-4" />
          <p className="font-quicksand text-silver">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <p className="font-quicksand text-red-500 mb-4">Error loading projects:</p>
            <p className="font-quicksand text-sm text-silver/60">{error}</p>
            <button
              onClick={() => fetchProjects()}
              className="mt-4 px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-dark">
      {/* Header */}
      <div className="bg-forest-main border-b border-forest-light">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-anton text-3xl text-silver mb-2">
                My Projects
              </h1>
              <p className="font-quicksand text-silver/60">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-forest-main rounded-full mb-6">
              <Music className="w-10 h-10 text-silver/40" />
            </div>
            <h2 className="font-anton text-2xl text-silver mb-4">
              No projects yet
            </h2>
            <p className="font-quicksand text-silver/60 mb-8 max-w-md mx-auto">
              Create your first project to start organizing your music with version control and collaboration features.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          // Projects grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}