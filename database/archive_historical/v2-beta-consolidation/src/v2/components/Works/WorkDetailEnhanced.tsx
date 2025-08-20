import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Music, Edit2, Plus, MoreVertical, 
  Check, XCircle, Play, Pause, Heart, ThumbsUp, Headphones,
  ChevronDown, X, Trash2, Calendar, Clock, User
} from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Project, SongVersion, VersionIteration } from '../../types/project.types';
import { GENRE_OPTIONS, KEY_OPTIONS } from '../../../constants/musicData';
import WorkVersionUpload from './WorkVersionUpload';
import WorkNotes from './WorkNotes';
import WorkTasks from './WorkTasks';

// Time signature options
const TIME_SIGNATURE_OPTIONS = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '7/4', '12/8', '9/8'];

// Mood options
const MOOD_OPTIONS = [
  'Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Peaceful',
  'Melancholic', 'Upbeat', 'Dark', 'Bright', 'Mysterious', 'Romantic'
];

interface WorkMetadata {
  tempo?: number;
  key?: string;
  timeSignature?: string;
  genre?: string;
  mood?: string;
  instruments?: string;
  recordingLocation?: string;
  producer?: string;
  engineer?: string;
  lyrics?: string;
}

/**
 * WorkDetailEnhanced - Comprehensive work management with V1 features adapted for V2
 */
export default function WorkDetailEnhanced() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    projects, 
    updateProject, 
    getVersions, 
    createVersion,
    getIterations,
    loading 
  } = useProjects();
  
  const [work, setWork] = useState<Project | null>(null);
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);
  const [iterations, setIterations] = useState<VersionIteration[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedWork, setEditedWork] = useState<Project | null>(null);
  const [metadata, setMetadata] = useState<WorkMetadata>({});
  const [showUpload, setShowUpload] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  // Removed tabs - all sections on one page

  // Multi-select dropdowns
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const [showTimeSignatureDropdown, setShowTimeSignatureDropdown] = useState(false);

  useEffect(() => {
    if (!workId) return;
    
    // Find the work from projects
    const foundWork = projects.find(p => p.id === workId);
    if (foundWork) {
      setWork(foundWork);
      setEditedWork(foundWork);
      
      // Parse metadata from the work
      if (foundWork.metadata) {
        setMetadata(foundWork.metadata as WorkMetadata);
      }
      
      // Load versions
      loadVersions();
    }
  }, [workId, projects]);

  const loadVersions = async () => {
    if (!workId) return;
    try {
      const versionsList = await getVersions(workId);
      setVersions(versionsList);
      
      // Select primary version by default
      const primary = versionsList.find(v => v.is_primary);
      if (primary) {
        setSelectedVersion(primary);
        loadIterations(primary.id);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const loadIterations = async (versionId: string) => {
    try {
      const iterationsList = await getIterations(versionId);
      setIterations(iterationsList);
    } catch (error) {
      console.error('Error loading iterations:', error);
    }
  };

  const handleSave = async () => {
    if (!work || !editedWork) return;
    
    try {
      await updateProject(work.id, {
        name: editedWork.name,
        artist: editedWork.artist,
        description: editedWork.description,
        metadata: {
          ...editedWork.metadata,
          ...metadata
        }
      });
      
      setWork(editedWork);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving work:', error);
    }
  };

  const handleCancel = () => {
    setEditedWork(work);
    setMetadata(work?.metadata || {});
    setIsEditing(false);
  };

  const handleCreateVersion = async (name: string, description?: string) => {
    if (!work) return;
    
    try {
      const versionNumber = `${versions.length + 1}.0.0`;
      await createVersion({
        project_id: work.id,
        name,
        description,
        version_number: versionNumber,
        is_primary: versions.length === 0
      });
      
      loadVersions();
      setShowVersionModal(false);
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  const toggleMultiValue = (field: keyof WorkMetadata, value: string) => {
    const currentValue = metadata[field] as string || '';
    const values = currentValue ? currentValue.split(',').map(v => v.trim()) : [];
    
    const newValues = values.includes(value)
      ? values.filter(v => v !== value)
      : [...values, value];
    
    setMetadata({
      ...metadata,
      [field]: newValues.join(', ')
    });
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
      <header className="bg-forest-main border-b border-forest-light sticky top-0 z-10">
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
                {isEditing ? (
                  <input
                    type="text"
                    value={editedWork?.name || ''}
                    onChange={(e) => setEditedWork({ ...editedWork!, name: e.target.value })}
                    className="font-anton text-2xl bg-transparent border-b border-accent-yellow text-silver focus:outline-none"
                  />
                ) : (
                  <h1 className="font-anton text-2xl text-silver">{work.name}</h1>
                )}
                {work.artist && (
                  <p className="font-quicksand text-sm text-silver/60">{work.artist}</p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-forest-light rounded-lg transition-colors text-silver/60 hover:text-silver"
                    title="Edit work details"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button className="text-silver/60 hover:text-silver transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="p-2 hover:bg-forest-light rounded-lg transition-colors text-accent-yellow"
                    title="Save changes"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-forest-light rounded-lg transition-colors text-accent-coral"
                    title="Cancel"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
          
        </div>
      </header>

      {/* Content - All sections on one scrollable page */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Navigation - Sticky sidebar */}
        <div className="fixed right-4 top-32 z-10 hidden xl:block">
          <nav className="bg-forest-main border border-forest-light rounded-lg p-4 space-y-2">
            <p className="font-quicksand text-xs text-silver/60 mb-3">Quick Nav</p>
            <a href="#overview" className="block font-quicksand text-sm text-silver hover:text-accent-yellow transition-colors">
              Overview
            </a>
            <a href="#versions" className="block font-quicksand text-sm text-silver hover:text-accent-yellow transition-colors">
              Versions
            </a>
            <a href="#notes" className="block font-quicksand text-sm text-silver hover:text-accent-yellow transition-colors">
              Notes
            </a>
            <a href="#tasks" className="block font-quicksand text-sm text-silver hover:text-accent-coral transition-colors">
              Tasks
            </a>
          </nav>
        </div>
        
        <div className="space-y-12">
        {/* SECTION 1: Overview & Quick Actions */}
        <section id="overview">
          <h2 className="font-anton text-2xl text-silver mb-6 flex items-center">
            <span className="bg-forest-light text-silver px-3 py-1 rounded-lg text-sm mr-3">OVERVIEW</span>
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
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
                  <button 
                    onClick={() => setShowVersionModal(true)}
                    className="flex items-center justify-center space-x-2 bg-accent-yellow/20 hover:bg-accent-yellow/30 text-accent-yellow rounded-lg px-4 py-3 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-quicksand font-medium">New Version</span>
                  </button>
                </div>
              </div>

              {/* Work Information */}
              <div className="bg-forest-main border border-forest-light rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-anton text-lg text-silver">Work Information</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div>
                    <label className="block font-quicksand text-xs text-silver/60 mb-1">Artist</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedWork?.artist || ''}
                        onChange={(e) => setEditedWork({ ...editedWork!, artist: e.target.value })}
                        className="w-full bg-forest-dark border border-forest-light rounded px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                      />
                    ) : (
                      <p className="font-quicksand text-sm text-silver">{work.artist || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block font-quicksand text-xs text-silver/60 mb-1">Key</label>
                    {isEditing ? (
                      <select
                        value={metadata.key || ''}
                        onChange={(e) => setMetadata({ ...metadata, key: e.target.value })}
                        className="w-full bg-forest-dark border border-forest-light rounded px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                      >
                        <option value="">Select key...</option>
                        {KEY_OPTIONS.map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-quicksand text-sm text-silver">{metadata.key || '—'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block font-quicksand text-xs text-silver/60 mb-1">Tempo</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={metadata.tempo || ''}
                        onChange={(e) => setMetadata({ ...metadata, tempo: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="BPM"
                        className="w-full bg-forest-dark border border-forest-light rounded px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                      />
                    ) : (
                      <p className="font-quicksand text-sm text-silver">
                        {metadata.tempo ? `${metadata.tempo} BPM` : '—'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block font-quicksand text-xs text-silver/60 mb-1">Time Signature</label>
                    {isEditing ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowTimeSignatureDropdown(!showTimeSignatureDropdown)}
                          className="w-full bg-forest-dark border border-forest-light rounded px-3 py-2 font-quicksand text-sm text-silver text-left flex items-center justify-between focus:outline-none focus:border-accent-yellow"
                        >
                          <span>{metadata.timeSignature || 'Select...'}</span>
                          <ChevronDown className="w-4 h-4 text-silver/60" />
                        </button>
                        
                        {showTimeSignatureDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-forest-main border border-forest-light rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                            {TIME_SIGNATURE_OPTIONS.map(sig => (
                              <button
                                key={sig}
                                onClick={() => {
                                  toggleMultiValue('timeSignature', sig);
                                  setShowTimeSignatureDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 font-quicksand text-sm text-silver hover:bg-forest-light/50 transition-colors"
                              >
                                {sig}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-quicksand text-sm text-silver">{metadata.timeSignature || '—'}</p>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block font-quicksand text-xs text-silver/60 mb-1">Genre</label>
                    {isEditing ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                          className="w-full bg-forest-dark border border-forest-light rounded px-3 py-2 font-quicksand text-sm text-silver text-left flex items-center justify-between focus:outline-none focus:border-accent-yellow"
                        >
                          <span>{metadata.genre || 'Select genres...'}</span>
                          <ChevronDown className="w-4 h-4 text-silver/60" />
                        </button>
                        
                        {showGenreDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-forest-main border border-forest-light rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                            {GENRE_OPTIONS.map(genre => {
                              const isSelected = metadata.genre?.includes(genre);
                              return (
                                <button
                                  key={genre}
                                  onClick={() => toggleMultiValue('genre', genre)}
                                  className={`w-full text-left px-3 py-2 font-quicksand text-sm hover:bg-forest-light/50 transition-colors flex items-center justify-between ${
                                    isSelected ? 'text-accent-yellow' : 'text-silver'
                                  }`}
                                >
                                  <span>{genre}</span>
                                  {isSelected && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-quicksand text-sm text-silver">{metadata.genre || '—'}</p>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block font-quicksand text-xs text-silver/60 mb-1">Mood</label>
                    {isEditing ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowMoodDropdown(!showMoodDropdown)}
                          className="w-full bg-forest-dark border border-forest-light rounded px-3 py-2 font-quicksand text-sm text-silver text-left flex items-center justify-between focus:outline-none focus:border-accent-yellow"
                        >
                          <span>{metadata.mood || 'Select moods...'}</span>
                          <ChevronDown className="w-4 h-4 text-silver/60" />
                        </button>
                        
                        {showMoodDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-forest-main border border-forest-light rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                            {MOOD_OPTIONS.map(mood => {
                              const isSelected = metadata.mood?.includes(mood);
                              return (
                                <button
                                  key={mood}
                                  onClick={() => toggleMultiValue('mood', mood)}
                                  className={`w-full text-left px-3 py-2 font-quicksand text-sm hover:bg-forest-light/50 transition-colors flex items-center justify-between ${
                                    isSelected ? 'text-accent-yellow' : 'text-silver'
                                  }`}
                                >
                                  <span>{mood}</span>
                                  {isSelected && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-quicksand text-sm text-silver">{metadata.mood || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-forest-main border border-forest-light rounded-xl p-6">
                <h3 className="font-anton text-lg text-silver mb-4">Status</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-quicksand text-xs text-silver/40 mb-1">Current Status</p>
                    <p className="font-quicksand text-sm text-silver capitalize">{work.status}</p>
                  </div>
                  <div>
                    <p className="font-quicksand text-xs text-silver/40 mb-1">Created</p>
                    <p className="font-quicksand text-sm text-silver">
                      {new Date(work.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-quicksand text-xs text-silver/40 mb-1">Last Updated</p>
                    <p className="font-quicksand text-sm text-silver">
                      {new Date(work.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Version */}
              {selectedVersion && (
                <div className="bg-forest-main border border-forest-light rounded-xl p-6">
                  <h3 className="font-anton text-lg text-silver mb-4">Primary Version</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-quicksand text-xs text-silver/40 mb-1">Version</p>
                      <p className="font-quicksand text-sm text-silver">{selectedVersion.name}</p>
                    </div>
                    <div>
                      <p className="font-quicksand text-xs text-silver/40 mb-1">Number</p>
                      <p className="font-quicksand text-sm text-silver">v{selectedVersion.version_number}</p>
                    </div>
                    {iterations.length > 0 && (
                      <div>
                        <p className="font-quicksand text-xs text-silver/40 mb-1">Iterations</p>
                        <p className="font-quicksand text-sm text-silver">{iterations.length} recordings</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: Versions & Audio */}
        <section id="versions">
          <div className="border-t-2 border-accent-yellow/20 pt-8">
            <h2 className="font-anton text-2xl text-silver mb-6 flex items-center">
              <span className="bg-accent-yellow text-forest-dark px-3 py-1 rounded-lg text-sm mr-3">VERSIONS</span>
            </h2>
            <div className="bg-forest-main border border-forest-light rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-quicksand text-lg text-silver">Audio Versions</h3>
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-accent-yellow/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-quicksand font-medium">New Version</span>
                </button>
              </div>
              
              {versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.map(version => (
                    <div 
                      key={version.id}
                      onClick={() => {
                        setSelectedVersion(version);
                        loadIterations(version.id);
                      }}
                      className={`bg-forest-dark rounded-lg p-4 hover:bg-forest-dark/70 transition-colors cursor-pointer ${
                        selectedVersion?.id === version.id ? 'ring-2 ring-accent-yellow' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Music className="w-5 h-5 text-silver/40" />
                          <div>
                            <p className="font-quicksand font-medium text-silver">
                              {version.name}
                            </p>
                            <p className="font-quicksand text-xs text-silver/40">
                              v{version.version_number} • {new Date(version.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {version.is_primary && (
                            <span className="px-2 py-1 bg-accent-yellow/20 text-accent-yellow font-quicksand text-xs rounded">
                              Primary
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowUpload(true);
                            }}
                            className="p-1 text-silver/40 hover:text-silver transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {selectedVersion?.id === version.id && iterations.length > 0 && (
                        <div className="mt-4 pl-8 space-y-2">
                          <p className="font-quicksand text-xs text-silver/60 mb-2">Iterations:</p>
                          {iterations.map(iteration => (
                            <div key={iteration.id} className="bg-forest-main rounded p-2">
                              <p className="font-quicksand text-xs text-silver">
                                {iteration.iteration_name || `Iteration ${iteration.iteration_number}`}
                              </p>
                              {iteration.file_url && (
                                <button className="text-accent-coral text-xs hover:underline">
                                  Play
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                    onClick={() => setShowVersionModal(true)}
                    className="text-accent-yellow hover:text-accent-yellow/80 font-quicksand text-sm"
                  >
                    Create your first version
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: Notes */}
        <section id="notes">
          <div className="border-t-2 border-accent-yellow/20 pt-8">
            <h2 className="font-anton text-2xl text-silver mb-6 flex items-center">
              <span className="bg-accent-yellow text-forest-dark px-3 py-1 rounded-lg text-sm mr-3">NOTES</span>
            </h2>
            <WorkNotes workId={work.id} />
          </div>
        </section>

        {/* SECTION 4: Tasks */}
        <section id="tasks">
          <div className="border-t-2 border-accent-coral/20 pt-8">
            <h2 className="font-anton text-2xl text-silver mb-6 flex items-center">
              <span className="bg-accent-coral text-white px-3 py-1 rounded-lg text-sm mr-3">TASKS</span>
            </h2>
            <WorkTasks workId={work.id} />
          </div>
        </section>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <WorkVersionUpload
          workId={work.id}
          versionId={selectedVersion?.id}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            loadVersions();
            if (selectedVersion) {
              loadIterations(selectedVersion.id);
            }
          }}
        />
      )}

      {/* Create Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-forest-main border border-forest-light rounded-xl max-w-md w-full p-6">
            <h2 className="font-anton text-xl text-silver mb-4">Create New Version</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateVersion(
                  formData.get('name') as string,
                  formData.get('description') as string
                );
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block font-quicksand text-sm text-silver mb-2">
                    Version Name <span className="text-accent-coral">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="e.g. Acoustic Version, Radio Edit..."
                    required
                    className="w-full px-4 py-3 bg-forest-dark border border-forest-light rounded-lg font-quicksand text-silver placeholder:text-silver/40 focus:outline-none focus:border-accent-yellow"
                  />
                </div>
                <div>
                  <label className="block font-quicksand text-sm text-silver mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="What's different about this version?"
                    className="w-full px-4 py-3 bg-forest-dark border border-forest-light rounded-lg font-quicksand text-silver placeholder:text-silver/40 focus:outline-none focus:border-accent-yellow resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 font-quicksand text-silver/60 hover:text-silver transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent-yellow text-forest-dark font-quicksand font-semibold rounded-lg hover:bg-accent-yellow/90 transition-colors"
                >
                  Create Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}