import React, { useEffect, useRef, useState } from 'react';
import { X, Music, Heart, ThumbsUp, Headphones, Edit2, Check, XCircle, Plus } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { formatDuration } from '../../utils/trackUtils';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import { KEY_OPTIONS, TIME_SIGNATURE_OPTIONS, GENRE_OPTIONS, CATEGORY_OPTIONS, MOOD_OPTIONS } from '../../constants/musicOptions';
import { PREDEFINED_TAGS } from '../../utils/tags';
import WaveformBars from '../Audio/WaveformBars';

interface TrackDetailsModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

const TrackDetailsModal: React.FC<TrackDetailsModalProps> = ({ track, isOpen, onClose }) => {
  // TrackDetailsModal rendered
  const modalRef = useRef<HTMLDivElement>(null);
  const { tracks, updateTrack, getAllUsedTags } = useLibrary();
  const { seek } = useAudio();
  
  // Get the latest track data from the library
  const currentTrack = track ? tracks.find(t => t.id === track.id) || track : null;
  
  // Single edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  
  // Edit values
  const [editValues, setEditValues] = useState<Partial<Track>>({});
  const [selectedTimeSignatures, setSelectedTimeSignatures] = useState<string[]>([]);
  const [customTimeSignature, setCustomTimeSignature] = useState('');
  
  // Tags state
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Start editing
  const startEditing = () => {
    if (!currentTrack) return;
    
    // Starting edit mode
    
    setIsEditing(true);
    setHasUnsavedChanges(false);
    const initialEditValues = {
      name: currentTrack.name || '',
      artist: currentTrack.artist || '',
      collection: currentTrack.collection || '',
      category: currentTrack.category || 'songs',
      key: currentTrack.key || '',
      tempo: currentTrack.tempo || undefined,
      timeSignature: currentTrack.timeSignature || '',
      genre: currentTrack.genre || '',
      mood: currentTrack.mood || '',
      notes: currentTrack.notes || '',
      tags: currentTrack.tags || []
    };
    // Starting edit with values
    setEditValues(initialEditValues);
    
    // Parse time signatures
    if (currentTrack.timeSignature) {
      setSelectedTimeSignatures(currentTrack.timeSignature.split(', '));
    } else {
      setSelectedTimeSignatures([]);
    }
  };
  
  // Save all edits
  const saveEdits = async () => {
    if (currentTrack && editValues) {
      // Build updates object with all fields
      const updates: Partial<Track> = {
        name: editValues.name || currentTrack.name,
        artist: editValues.artist,
        collection: editValues.collection,
        category: editValues.category || currentTrack.category,
        key: editValues.key,
        tempo: editValues.tempo,
        timeSignature: selectedTimeSignatures.length > 0 ? selectedTimeSignatures.join(', ') : '',
        genre: editValues.genre,
        mood: editValues.mood,
        notes: editValues.notes,
        tags: editValues.tags || currentTrack.tags || []
      };
      
      // TrackDetailsModal - Saving edits
      
      try {
        // About to call updateTrack
        
        await updateTrack(currentTrack.id, updates);
        setIsEditing(false);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error saving track:', error);
        alert('Failed to save changes. Please try again.');
      }
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    if (hasUnsavedChanges) {
      setShowCloseWarning(true);
    } else {
      setIsEditing(false);
      setEditValues({});
      setSelectedTimeSignatures([]);
    }
  };
  
  // Handle close
  const handleClose = () => {
    if (isEditing && hasUnsavedChanges) {
      setShowCloseWarning(true);
    } else {
      onClose();
    }
  };
  
  // Force close (discard changes)
  const forceClose = () => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setShowCloseWarning(false);
    setEditValues({});
    setSelectedTimeSignatures([]);
    onClose();
  };
  
  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal is closed
      setTimeout(() => {
        setIsEditing(false);
        setHasUnsavedChanges(false);
        setShowCloseWarning(false);
        setEditValues({});
        setSelectedTimeSignatures([]);
      }, 300); // Wait for close animation
    }
  }, [isOpen]);
  
  // Update a field and mark as changed
  const updateField = (field: string, value: unknown) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };
  
  // Tag management
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    
    if (isEditing) {
      // In edit mode, update editValues
      const currentTags = editValues.tags || [];
      if (!currentTags.includes(trimmedTag)) {
        updateField('tags', [...currentTags, trimmedTag]);
      }
    } else {
      // Not in edit mode, update immediately
      if (currentTrack && !currentTrack.tags.includes(trimmedTag)) {
        updateTrack(currentTrack.id, {
          tags: [...currentTrack.tags, trimmedTag]
        });
      }
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };
  
  const removeTag = (tagToRemove: string) => {
    if (isEditing) {
      // In edit mode, update editValues
      const currentTags = editValues.tags || [];
      updateField('tags', currentTags.filter(tag => tag !== tagToRemove));
    } else {
      // Not in edit mode, update immediately
      if (currentTrack) {
        updateTrack(currentTrack.id, {
          tags: currentTrack.tags.filter(tag => tag !== tagToRemove)
        });
      }
    }
  };
  
  // Get tag suggestions
  const usedTags = getAllUsedTags().map(({ tag }) => tag);
  const allTags = [...new Set([...PREDEFINED_TAGS, ...usedTags])];
  const tagSuggestions = tagInput
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !currentTrack?.tags.includes(tag)
      )
    : [];
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showCloseWarning) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, showCloseWarning]);
  
  if (!currentTrack || !isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          ref={modalRef}
          className="bg-forest-main rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-forest-light">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-10 h-10 bg-forest-light rounded-lg flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-accent-yellow" />
              </div>
              <div className="flex-1">
                <h2 className="font-anton text-xl text-silver">Track Details</h2>
                <p className="font-quicksand text-sm text-silver/60">
                  {isEditing && editValues.name ? editValues.name : currentTrack.name}
                </p>
              </div>
              
              {/* Single Edit Toggle */}
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="p-2 hover:bg-forest-light rounded-lg transition-colors"
                  title="Edit track details"
                >
                  <Edit2 className="w-5 h-5 text-silver/60 hover:text-silver" />
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={saveEdits}
                    className="p-2 hover:bg-forest-light rounded-lg transition-colors text-accent-yellow"
                    title="Save changes"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="p-2 hover:bg-forest-light rounded-lg transition-colors text-accent-coral"
                    title="Cancel"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center ml-4">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-forest-light rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-silver/60 hover:text-silver" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Waveform Visualization */}
            <div className="p-6 border-b border-forest-light">
              <WaveformBars
                audioUrl={currentTrack.url}
                trackId={currentTrack.id}
                height={60}
                barCount={40}
                onSeek={seek}
              />
            </div>
            
            {/* Track Info Section */}
            <div className="p-6 space-y-6">
              <h3 className="font-anton text-base text-silver uppercase tracking-wider">Track Information</h3>
              
              {/* Title Field */}
              <div>
                <label className="font-quicksand text-sm text-silver/80 block mb-2">Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editValues.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50"
                  />
                ) : (
                  <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                    <p className="font-quicksand text-base text-silver">{currentTrack.name}</p>
                  </div>
                )}
              </div>

              {/* Artist and Album Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Artist</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValues.artist || ''}
                      onChange={(e) => updateField('artist', e.target.value)}
                      className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50"
                    />
                  ) : (
                    <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                      <p className="font-quicksand text-base text-silver">{currentTrack.artist || '—'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Album / Collection</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValues.collection || ''}
                      onChange={(e) => updateField('collection', e.target.value)}
                      className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50"
                    />
                  ) : (
                    <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                      <p className="font-quicksand text-base text-silver">{currentTrack.collection || '—'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Category, Duration, Upload Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Category</label>
                  {isEditing ? (
                    <select
                      value={editValues.category || currentTrack.category}
                      onChange={(e) => updateField('category', e.target.value as TrackCategory)}
                      className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50 cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value} className="bg-forest-main">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                      <p className="font-quicksand text-base text-silver capitalize">{currentTrack.category.replace('-', ' ')}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Duration</label>
                  <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                    <p className="font-quicksand text-base text-silver">{formatDuration(currentTrack.duration)}</p>
                  </div>
                </div>
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Uploaded</label>
                  <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                    <p className="font-quicksand text-base text-silver">
                      {new Date(currentTrack.uploadedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Musical Properties */}
            <div className="p-6 space-y-6 border-t border-forest-light">
              <h3 className="font-anton text-base text-silver uppercase tracking-wider">Musical Properties</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Key</label>
                  {isEditing ? (
                    <select
                      value={editValues.key || ''}
                      onChange={(e) => updateField('key', e.target.value)}
                      className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50 cursor-pointer"
                    >
                      <option value="" className="bg-forest-main">—</option>
                      {KEY_OPTIONS.map(key => (
                        <option key={key} value={key} className="bg-forest-main">
                          {key}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                      <p className="font-quicksand text-base text-silver">{currentTrack.key || '—'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Tempo</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editValues.tempo || ''}
                      onChange={(e) => updateField('tempo', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50"
                      placeholder="BPM"
                    />
                  ) : (
                    <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                      <p className="font-quicksand text-base text-silver">{currentTrack.tempo ? `${currentTrack.tempo} BPM` : '—'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Signature */}
              <div>
                <label className="font-quicksand text-sm text-silver/80 block mb-2">Time Signature</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="bg-forest-light/50 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                      {TIME_SIGNATURE_OPTIONS.map(sig => (
                        <label key={sig} className="flex items-center space-x-2 cursor-pointer hover:text-accent-yellow">
                          <input
                            type="checkbox"
                            checked={selectedTimeSignatures.includes(sig)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTimeSignatures([...selectedTimeSignatures, sig]);
                              } else {
                                setSelectedTimeSignatures(selectedTimeSignatures.filter(s => s !== sig));
                              }
                              setHasUnsavedChanges(true);
                            }}
                            className="w-4 h-4 rounded bg-forest-light border-silver/40 text-accent-yellow focus:ring-accent-yellow/50"
                          />
                          <span className="font-quicksand text-sm text-silver">{sig}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={customTimeSignature}
                        onChange={(e) => setCustomTimeSignature(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && customTimeSignature.trim()) {
                            e.preventDefault();
                            if (!selectedTimeSignatures.includes(customTimeSignature.trim())) {
                              setSelectedTimeSignatures([...selectedTimeSignatures, customTimeSignature.trim()]);
                              setCustomTimeSignature('');
                              setHasUnsavedChanges(true);
                            }
                          }
                        }}
                        placeholder="Add custom (e.g. 9/8)"
                        className="flex-1 bg-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                    <p className="font-quicksand text-base text-silver">{currentTrack.timeSignature || '—'}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Genre</label>
                  {isEditing ? (
                    <select
                      value={editValues.genre || ''}
                      onChange={(e) => updateField('genre', e.target.value)}
                      className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50 cursor-pointer"
                    >
                      <option value="" className="bg-forest-main">—</option>
                      {GENRE_OPTIONS.map(genre => (
                        <option key={genre} value={genre} className="bg-forest-main">
                          {genre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                      <p className="font-quicksand text-base text-silver">{currentTrack.genre || '—'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-quicksand text-sm text-silver/80 block mb-2">Mood</label>
                  {isEditing ? (
                    <select
                      value={editValues.mood || ''}
                      onChange={(e) => updateField('mood', e.target.value)}
                      className="w-full bg-forest-light/50 rounded-lg px-4 py-3 font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50 cursor-pointer"
                    >
                      <option value="" className="bg-forest-main">—</option>
                      {MOOD_OPTIONS.map(mood => (
                        <option key={mood} value={mood} className="bg-forest-main">
                          {mood}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-forest-light/50 rounded-lg px-4 py-3">
                      <p className="font-quicksand text-base text-silver">{currentTrack.mood || '—'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="p-6 space-y-4 border-t border-forest-light">
              <h3 className="font-anton text-base text-silver uppercase tracking-wider">Notes</h3>
              {isEditing ? (
                <textarea
                  value={editValues.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full bg-forest-light/50 rounded-lg p-4 min-h-[120px] font-quicksand text-base text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50 resize-none"
                  placeholder="Add notes about this track..."
                />
              ) : (
                <div className="bg-forest-light/50 rounded-lg p-4 min-h-[120px]">
                  <p className="font-quicksand text-base text-silver whitespace-pre-wrap">
                    {currentTrack.notes || <span className="text-silver/40">No notes added</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Tags - Always Editable */}
            <div className="p-6 space-y-4 border-t border-forest-light">
              <h3 className="font-anton text-base text-silver uppercase tracking-wider">Tags</h3>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(isEditing ? (editValues.tags || []) : currentTrack.tags).map(tag => (
                    <span
                      key={tag}
                      className="group px-3 py-1.5 bg-forest-main rounded-full font-quicksand text-sm text-silver flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3 text-silver/60 hover:text-accent-coral" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowTagSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      onFocus={() => setShowTagSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                      placeholder="Add a tag..."
                      className="flex-1 bg-forest-light/50 rounded-lg px-4 py-2 font-quicksand text-sm text-silver outline-none focus:ring-2 focus:ring-accent-yellow/50"
                    />
                    <button
                      onClick={() => tagInput.trim() && addTag(tagInput)}
                      className="p-2 bg-forest-light hover:bg-forest-light/80 rounded-lg transition-colors"
                      title="Add tag"
                    >
                      <Plus className="w-4 h-4 text-silver" />
                    </button>
                  </div>
                  
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-forest-main border border-forest-light rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                      {tagSuggestions.map(tag => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="w-full text-left px-4 py-2 font-quicksand text-sm text-silver hover:bg-forest-light transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* My Rating - Always Available */}
            <div className="p-6 space-y-4 border-t border-forest-light">
              <h3 className="font-anton text-base text-silver uppercase tracking-wider">My Rating</h3>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => updateTrack(currentTrack.id, { listened: !currentTrack.listened })}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentTrack.listened 
                      ? 'bg-accent-yellow/20 text-accent-yellow' 
                      : 'bg-forest-light text-silver/40 hover:text-silver'
                  }`}
                >
                  <Headphones className="w-5 h-5" />
                  <span className="font-quicksand text-sm">Listened</span>
                </button>
                <button 
                  onClick={() => updateTrack(currentTrack.id, { liked: !currentTrack.liked })}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentTrack.liked 
                      ? 'bg-accent-yellow/20 text-accent-yellow' 
                      : 'bg-forest-light text-silver/40 hover:text-silver'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-quicksand text-sm">Liked</span>
                </button>
                <button 
                  onClick={() => updateTrack(currentTrack.id, { loved: !currentTrack.loved })}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentTrack.loved 
                      ? 'bg-accent-coral/20 text-accent-coral' 
                      : 'bg-forest-light text-silver/40 hover:text-silver'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span className="font-quicksand text-sm">Loved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Close Warning Dialog */}
      {showCloseWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
          <div className="bg-forest-main rounded-xl p-6 max-w-md w-full mx-4 animate-slide-up">
            <h3 className="font-anton text-xl text-silver mb-4">Unsaved Changes</h3>
            <p className="font-quicksand text-silver/80 mb-6">
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowCloseWarning(false)}
                className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
              >
                Continue Editing
              </button>
              <button
                onClick={forceClose}
                className="px-4 py-2 bg-accent-coral text-silver rounded-lg font-quicksand font-medium hover:bg-accent-coral/90 transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={async () => {
                  await saveEdits();
                  setShowCloseWarning(false);
                  onClose();
                }}
                className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrackDetailsModal;