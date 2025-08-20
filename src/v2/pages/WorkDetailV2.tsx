import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Music, Edit2, Plus, MoreVertical, 
  Check, XCircle, Calendar, Clock, User
} from 'lucide-react';
import { V2Layout } from '../components/Layout/V2Layout';
import { useProjects } from '../contexts/ProjectContext';
import { Project, SongVersion, VersionIteration } from '../types/project.types';

/**
 * WorkDetailV2 - Simplified work detail page with proper V2 layout
 */
export function WorkDetailV2() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const { projects, loading, fetchProjects } = useProjects();
  const [work, setWork] = useState<Project | null>(null);

  // Scroll navigation function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (workId && projects.length > 0) {
      const foundWork = projects.find(p => p.id === workId);
      setWork(foundWork || null);
    }
  }, [workId, projects]);

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

  if (loading) {
    return (
      <V2Layout title="Loading..." subtitle="Fetching work details">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-silver font-quicksand">Loading work...</span>
        </div>
      </V2Layout>
    );
  }

  if (!work) {
    return (
      <V2Layout title="Work Not Found" subtitle="The requested work could not be found">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🎵</div>
          <h3 className="text-xl font-anton text-silver mb-3">Work Not Found</h3>
          <p className="font-quicksand text-silver/60 text-lg mb-8">
            The work you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/works')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-accent-yellow text-gray-900 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Works</span>
          </button>
        </div>
      </V2Layout>
    );
  }

  return (
    <V2Layout 
      title={work.name} 
      subtitle="Your creative work"
    >
      {/* Work Header Actions */}
      <div className="mb-8 flex justify-between items-center">
        <button
          onClick={() => navigate('/works')}
          className="inline-flex items-center space-x-2 text-silver/60 hover:text-silver transition-colors font-quicksand text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Works</span>
        </button>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-forest-main border border-forest-light rounded-lg text-silver/60 hover:text-silver transition-colors font-quicksand text-sm">
            <Edit2 className="w-4 h-4" />
            <span>Edit Work</span>
          </button>
          <button className="text-silver/40 hover:text-silver transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sticky Section Navigation */}
      <div className="sticky top-0 z-50 bg-forest-dark/95 backdrop-blur-sm border-b border-forest-light mb-8">
        <div className="flex space-x-4 px-4 py-4">
          {[
            { key: 'work-info', label: 'Work Info', icon: Music },
            { key: 'versions', label: 'Versions', icon: Upload },
            { key: 'notes', label: 'Notes', icon: Edit2 },
            { key: 'tasks', label: 'Tasks', icon: Check }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => scrollToSection(key)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-quicksand text-sm text-silver/60 hover:text-silver hover:bg-forest-main/50"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Sections */}
      <div className="space-y-16">
        {/* Work Information Section */}
        <section id="work-info" className="scroll-mt-24">
          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-forest-main border border-forest-light rounded-lg p-6">
              <h3 className="font-anton text-xl text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center space-x-2 p-3 bg-accent-coral/20 border border-accent-coral/30 rounded-lg text-accent-coral hover:bg-accent-coral/30 transition-colors font-quicksand text-sm">
                  <Upload className="w-4 h-4" />
                  <span>Upload Audio</span>
                </button>
                <button className="flex items-center space-x-2 p-3 bg-accent-yellow/20 border border-accent-yellow/30 rounded-lg text-accent-yellow hover:bg-accent-yellow/30 transition-colors font-quicksand text-sm">
                  <Plus className="w-4 h-4" />
                  <span>New Version</span>
                </button>
              </div>
            </div>

            <div className="bg-forest-main border border-forest-light rounded-lg p-6">
              <h3 className="font-anton text-xl text-white mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-silver/70 font-quicksand text-sm">Current Status</span>
                  <span className="text-white font-quicksand text-sm">{work.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver/70 font-quicksand text-sm">Type</span>
                  <span className="text-white font-quicksand text-sm">{work.project_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver/70 font-quicksand text-sm">Created</span>
                  <span className="text-white font-quicksand text-sm">{formatDate(work.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver/70 font-quicksand text-sm">Last Updated</span>
                  <span className="text-white font-quicksand text-sm">{formatDate(work.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-forest-main border border-forest-light rounded-lg p-6">
            <h3 className="font-anton text-xl text-white mb-6">Work Information</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-silver/70 font-quicksand text-sm mb-2">Artist</label>
                <div className="text-white font-quicksand">{work.artist || '—'}</div>
              </div>
              <div>
                <label className="block text-silver/70 font-quicksand text-sm mb-2">Key</label>
                <div className="text-white font-quicksand">{work.metadata?.key_signature || '—'}</div>
              </div>
              <div>
                <label className="block text-silver/70 font-quicksand text-sm mb-2">Tempo</label>
                <div className="text-white font-quicksand">{work.metadata?.bpm ? `${work.metadata.bpm} BPM` : '—'}</div>
              </div>
              <div>
                <label className="block text-silver/70 font-quicksand text-sm mb-2">Time Signature</label>
                <div className="text-white font-quicksand">{work.metadata?.time_signature || '—'}</div>
              </div>
              <div>
                <label className="block text-silver/70 font-quicksand text-sm mb-2">Genre</label>
                <div className="text-white font-quicksand">{work.metadata?.genre || '—'}</div>
              </div>
              <div>
                <label className="block text-silver/70 font-quicksand text-sm mb-2">Category</label>
                <div className="text-white font-quicksand">{work.metadata?.category || '—'}</div>
              </div>
            </div>
            {work.description && (
              <div className="mt-6">
                <label className="block text-silver/70 font-quicksand text-sm mb-2">Description</label>
                <div className="text-white font-quicksand">{work.description}</div>
              </div>
            )}
          </div>
        </section>

        {/* Versions Section */}
        <section id="versions" className="scroll-mt-24">
          <div className="bg-forest-main border border-forest-light rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-anton text-xl text-white">Audio Versions</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-gray-900 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Version</span>
              </button>
            </div>
            
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎵</div>
              <p className="font-quicksand text-silver/60 text-lg mb-4">No versions yet</p>
              <button className="text-accent-yellow hover:text-accent-yellow/80 font-quicksand text-sm">
                Create your first version
              </button>
            </div>
          </div>
        </section>

        {/* Notes Section */}
        <section id="notes" className="scroll-mt-24">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-forest-main border border-forest-light rounded-lg p-6">
              <h3 className="font-anton text-xl text-white mb-4">Add Note</h3>
              <textarea
                placeholder="Write a note about this work... (Press Enter to save, Shift+Enter for new line)"
                className="w-full h-32 bg-forest-dark border border-forest-light rounded-lg p-3 text-white font-quicksand resize-none focus:outline-none focus:border-accent-yellow"
              />
              <button className="mt-4 w-full py-2 bg-accent-yellow text-gray-900 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors">
                Add Note
              </button>
            </div>

            <div className="bg-forest-main border border-forest-light rounded-lg p-6">
              <h3 className="font-anton text-xl text-white mb-4">Notes</h3>
              <div className="text-center py-8">
                <p className="font-quicksand text-silver/60">No notes yet</p>
                <p className="font-quicksand text-silver/50 text-sm mt-2">
                  Add notes to track ideas, lyrics, and progress
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks Section */}
        <section id="tasks" className="scroll-mt-24">
          <div className="bg-forest-main border border-forest-light rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-anton text-xl text-white">Tasks</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-gray-900 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
            
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <p className="font-quicksand text-silver/60 text-lg mb-4">No tasks yet</p>
              <p className="font-quicksand text-silver/50 text-sm">
                Add tasks to track your progress on this work
              </p>
            </div>
          </div>
        </section>
      </div>
    </V2Layout>
  );
}