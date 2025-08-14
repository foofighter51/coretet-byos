import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Users, Calendar, Clock, ChevronRight, Disc } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Project } from '../../types/project.types';

interface ProjectCardProps {
  project: Project;
}

/**
 * ProjectCard - Individual project display card
 * Shows project info with hover effects
 */
export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/projects/${project.id}`);
  };

  // Get project type icon
  const getProjectIcon = () => {
    switch (project.project_type) {
      case 'album':
        return <Disc className="w-5 h-5" />;
      case 'ep':
        return <Music className="w-5 h-5" />;
      case 'single':
        return <Music className="w-5 h-5" />;
      default:
        return <Music className="w-5 h-5" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (project.status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-silver/20 text-silver border-silver/30';
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-forest-main rounded-xl border border-forest-light hover:border-accent-yellow/50 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Cover Image or Placeholder */}
      <div className="aspect-square bg-forest-light relative overflow-hidden">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              {getProjectIcon()}
              <p className="font-quicksand text-xs text-silver/40 mt-2">
                {project.project_type}
              </p>
            </div>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="p-4 w-full">
            <button className="w-full flex items-center justify-center space-x-2 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium">
              <span>Open Project</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="p-4">
        {/* Title and Status */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-anton text-lg text-silver group-hover:text-accent-yellow transition-colors line-clamp-1">
            {project.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-quicksand border ${getStatusColor()}`}>
            {project.status}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="font-quicksand text-sm text-silver/60 line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs font-quicksand text-silver/40">
          <div className="flex items-center space-x-3">
            {/* Version count - will be populated when we have relations */}
            <div className="flex items-center space-x-1">
              <Music className="w-3 h-3" />
              <span>{project.versions?.length || 0} versions</span>
            </div>
            
            {/* Collaborator count */}
            {project.collaborators && project.collaborators.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{project.collaborators.length}</span>
              </div>
            )}
          </div>

          {/* Last updated */}
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Target Release Date */}
        {project.target_release_date && (
          <div className="mt-3 pt-3 border-t border-forest-light">
            <div className="flex items-center space-x-1 text-xs font-quicksand text-accent-coral">
              <Calendar className="w-3 h-3" />
              <span>Release: {new Date(project.target_release_date).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}