import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, Calendar, User, Music } from 'lucide-react';
import { V2Layout } from '../components/Layout/V2Layout';
import { useProjects } from '../contexts/ProjectContext';
import CreateWorkModal from '../components/Works/CreateWorkModal';

interface Work {
  id: string;
  name: string;
  artist?: string;
  created_at: string;
  updated_at: string;
  project_type: string;
}

export function WorksListV2() {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Fetch projects when component mounts
    fetchProjects();
  }, [fetchProjects]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const handleWorkClick = (workId: string) => {
    navigate(`/work/${workId}`);
  };

  if (loading) {
    return (
      <V2Layout title="My Works" subtitle="Your songs and compositions">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-silver font-quicksand">Loading your works...</span>
        </div>
      </V2Layout>
    );
  }

  return (
    <V2Layout title="My Works" subtitle="Your songs and compositions" showSecondaryToolbar={true}>
      {/* Create New Work Button */}
      <div className="mb-8 flex justify-between items-center">
        <div className="text-sm text-silver/60 font-quicksand">
          {projects.length} {projects.length === 1 ? 'work' : 'works'} total
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-gray-900 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
        >
          <PenTool className="w-4 h-4" />
          <span>Create New Work</span>
        </button>
      </div>

      {projects.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🎵</div>
          <h3 className="text-xl font-anton text-silver mb-3">No Works Yet</h3>
          <p className="font-quicksand text-silver/60 text-lg mb-8 max-w-md mx-auto">
            Start your musical journey by creating your first work. Document your creative process from initial idea to final version.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-accent-yellow text-gray-900 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-all duration-300 hover:transform hover:scale-105"
          >
            <PenTool className="w-5 h-5" />
            <span>Create Your First Work</span>
          </button>
        </div>
      ) : (
        /* Works Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((work) => (
            <div
              key={work.id}
              onClick={() => handleWorkClick(work.id)}
              className="group bg-forest-main border border-forest-light hover:border-accent-yellow rounded-lg p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-105"
            >
              {/* Work Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-anton text-lg text-white truncate group-hover:text-accent-yellow transition-colors">
                    {work.name}
                  </h3>
                  {work.artist && (
                    <div className="flex items-center space-x-1 mt-1">
                      <User className="w-3 h-3 text-silver/60" />
                      <span className="font-quicksand text-sm text-silver/70 truncate">
                        {work.artist}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 w-8 h-8 bg-accent-yellow/20 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/30 transition-colors">
                  <Music className="w-4 h-4 text-accent-yellow" />
                </div>
              </div>

              {/* Work Stats - placeholder for now */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-anton text-accent-coral">0</div>
                  <div className="text-xs font-quicksand text-silver/60">Versions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-anton text-accent-coral">0</div>
                  <div className="text-xs font-quicksand text-silver/60">Iterations</div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-xs font-quicksand text-silver/50">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>Created {formatDate(work.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>Updated {formatDate(work.updated_at)}</span>
                </div>
              </div>

              {/* Hover Indicator */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs font-quicksand text-accent-yellow">
                  Click to view details →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Work Modal */}
      {showCreateModal && (
        <CreateWorkModal onClose={() => setShowCreateModal(false)} />
      )}
    </V2Layout>
  );
}