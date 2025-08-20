import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Music, Edit, Plus, MoreVertical } from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';
import { Project, SongVersion } from '../../types/project.types';

/**
 * WorkDetail - Display and manage a single work (project)
 * Shows work info, versions, and allows uploading audio
 */
export default function WorkDetail() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const { projects, getVersions, loading } = useProjects();
  const [work, setWork] = useState<Project | null>(null);
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!workId) return;
    
    // Find the work from projects
    const foundWork = projects.find(p => p.id === workId);
    if (foundWork) {
      setWork(foundWork);
      
      // Load versions
      loadVersions();
    }
  }, [workId, projects]);

  const loadVersions = async () => {
    if (!workId) return;
    try {
      const versionsList = await getVersions(workId);
      setVersions(versionsList);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="font-quicksand text-silver">Loading...</div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="text-center">
          <p className="font-quicksand text-silver mb-4">Work not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-accent-yellow hover:text-accent-yellow/80 font-quicksand text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-dark">
      {/* Header */}
      <header className="bg-forest-main border-b border-forest-light">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-silver/60 hover:text-silver transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-anton text-2xl text-silver">{work.name}</h1>
                {work.artist && (
                  <p className="font-quicksand text-sm text-silver/60">{work.artist}</p>
                )}
              </div>
            </div>
            <button className="text-silver/60 hover:text-silver transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Work Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-forest-main border border-forest-light rounded-xl p-6">
              <h2 className="font-anton text-lg text-silver mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center justify-center space-x-2 bg-accent-coral/20 hover:bg-accent-coral/30 text-accent-coral rounded-lg px-4 py-3 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-quicksand font-medium">Upload Audio</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-accent-yellow/20 hover:bg-accent-yellow/30 text-accent-yellow rounded-lg px-4 py-3 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="font-quicksand font-medium">Add Version</span>
                </button>
              </div>
            </div>

            {/* Versions */}
            <div className="bg-forest-main border border-forest-light rounded-xl p-6">
              <h2 className="font-anton text-lg text-silver mb-4">Versions</h2>
              {versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.map(version => (
                    <div 
                      key={version.id}
                      className="bg-forest-dark rounded-lg p-4 hover:bg-forest-dark/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Music className="w-5 h-5 text-silver/40" />
                          <div>
                            <p className="font-quicksand font-medium text-silver">
                              {version.name}
                            </p>
                            <p className="font-quicksand text-xs text-silver/40">
                              v{version.version_number}
                            </p>
                          </div>
                        </div>
                        {version.is_primary && (
                          <span className="px-2 py-1 bg-accent-yellow/20 text-accent-yellow font-quicksand text-xs rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-silver/20 mx-auto mb-3" />
                  <p className="font-quicksand text-silver/60 mb-4">
                    No versions yet
                  </p>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="text-accent-coral hover:text-accent-coral/80 font-quicksand text-sm"
                  >
                    Upload your first audio file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Work Details */}
            <div className="bg-forest-main border border-forest-light rounded-xl p-6">
              <h3 className="font-anton text-lg text-silver mb-4">Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-quicksand text-xs text-silver/40 mb-1">Status</p>
                  <p className="font-quicksand text-sm text-silver capitalize">{work.status}</p>
                </div>
                <div>
                  <p className="font-quicksand text-xs text-silver/40 mb-1">Type</p>
                  <p className="font-quicksand text-sm text-silver capitalize">{work.project_type}</p>
                </div>
                <div>
                  <p className="font-quicksand text-xs text-silver/40 mb-1">Created</p>
                  <p className="font-quicksand text-sm text-silver">
                    {new Date(work.created_at).toLocaleDateString()}
                  </p>
                </div>
                {work.description && (
                  <div>
                    <p className="font-quicksand text-xs text-silver/40 mb-1">Notes</p>
                    <p className="font-quicksand text-sm text-silver">{work.description}</p>
                  </div>
                )}
              </div>
              <button className="mt-4 w-full flex items-center justify-center space-x-2 text-silver/60 hover:text-silver transition-colors">
                <Edit className="w-4 h-4" />
                <span className="font-quicksand text-sm">Edit Details</span>
              </button>
            </div>

            {/* Activity */}
            <div className="bg-forest-main border border-forest-light rounded-xl p-6">
              <h3 className="font-anton text-lg text-silver mb-4">Recent Activity</h3>
              <p className="font-quicksand text-sm text-silver/40">No activity yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal (placeholder for now) */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-forest-main border border-forest-light rounded-xl max-w-md w-full p-6">
            <h2 className="font-anton text-xl text-silver mb-4">Upload Audio</h2>
            <p className="font-quicksand text-silver/60 mb-4">
              Upload feature coming soon...
            </p>
            <button
              onClick={() => setShowUpload(false)}
              className="px-4 py-2 bg-forest-dark text-silver font-quicksand rounded-lg hover:bg-forest-dark/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}