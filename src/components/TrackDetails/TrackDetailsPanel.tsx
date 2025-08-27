import React, { useState } from 'react';
import { X, Music, Edit2, Check, XCircle, ChevronLeft, Heart, ThumbsUp, Headphones, Play, Pause, Rewind, FastForward, Volume2, Plus, ChevronDown } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import DetailedWaveform from '../Audio/DetailedWaveform';
import { PREDEFINED_TAGS, getTagColor } from '../../utils/tags';
import ExpandedMetadataEditor from './ExpandedMetadataEditor';
import { GENRE_OPTIONS, KEY_OPTIONS } from '../../constants/musicData';
import { parseTrackNotes, stringifyTrackNotes, getExtendedValue, setExtendedValue } from '../../utils/metadataUtils';
import { TasksList } from '../Tasks/TasksList';
import DetailedRatings from './DetailedRatings';
import TrackComments from './TrackComments';

interface TrackDetailsPanelProps {
  track: Track | null;
  onClose: () => void;
  playlistId?: string | null;
}

// Predefined options
const timeSignatureOptions = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '7/4', '12/8', '9/8'];
const moodOptions = [
  'Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Peaceful',
  'Melancholic', 'Upbeat', 'Dark', 'Bright', 'Mysterious', 'Romantic'
];

// Multi-select component
interface MultiSelectProps {
  value: string | undefined;
  options: string[];
  onChange: (value: string) => void;
  onToggle: (option: string) => void;
  placeholder: string;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ 
  value, 
  options, 
  onChange, 
  onToggle, 
  placeholder,
  showDropdown,
  setShowDropdown
}) => {
  const selectedValues = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
  
  return (
    <div className="relative">
      <div 
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver cursor-pointer hover:border-accent-yellow focus:outline-none focus:border-accent-yellow flex items-center justify-between"
      >
        <span className={selectedValues.length > 0 ? '' : 'text-silver/60'}>
          {selectedValues.length > 0 ? selectedValues.join(', ') : placeholder}
        </span>
        <ChevronDown className={`w-3 h-3 text-silver/60 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </div>
      
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-forest-main border border-forest-light rounded-lg shadow-xl z-[100] max-h-48 overflow-y-auto">
          <div className="py-1">
            {options.map(option => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={option}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(option);
                  }}
                  className={`w-full text-left px-3 py-2 font-quicksand text-sm hover:bg-forest-light/50 transition-colors flex items-center justify-between ${
                    isSelected ? 'text-accent-yellow' : 'text-silver'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-forest-light p-2">
            <input
              type="text"
              placeholder="Custom value..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  onToggle(e.currentTarget.value.trim());
                  e.currentTarget.value = '';
                  e.preventDefault();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-xs text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TrackDetailsPanel: React.FC<TrackDetailsPanelProps> = ({ track, onClose, playlistId }) => {
  const { tracks, updateTrack, getAllUsedTags, playlists, sharedPlaylists } = useLibrary();
  const { seek, play, pause, isPlaying, currentTrack: playingTrackId, currentTime, volume, setVolume } = useAudio();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExtended, setIsEditingExtended] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [waveformError, setWaveformError] = useState(false);
  const [editedTrack, setEditedTrack] = useState<Track>(track || {} as Track);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [showTimeSignatureDropdown, setShowTimeSignatureDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  
  // Get the latest track data from the library
  const currentTrack = track ? tracks.find(t => t.id === track.id) || track : null;
  
  // Check if this track is currently playing
  const isCurrentlyPlaying = currentTrack && playingTrackId === currentTrack.id && isPlaying;
  
  // Update editedTrack when currentTrack changes
  React.useEffect(() => {
    if (currentTrack) {
      setEditedTrack(currentTrack);
    }
  }, [currentTrack?.id]);
  
  if (!currentTrack) return null;

  const handleSave = async (editedData: Track) => {
    try {
      const updates: Partial<Track> = {
        name: editedData.name,
        category: editedData.category,
        artist: editedData.artist || undefined,
        collection: editedData.collection || undefined,
        key: editedData.key || undefined,
        tempo: editedData.tempo || undefined,
        timeSignature: editedData.timeSignature || undefined,
        genre: editedData.genre || undefined,
        mood: editedData.mood || undefined,
        notes: editedData.notes || undefined,
        tags: editedData.tags || [],
      };
      
      await updateTrack(currentTrack.id, updates);
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving track:', error);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    setEditedTrack(currentTrack);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };
  
  const handleFieldChange = (field: keyof Track, value: unknown) => {
    setEditedTrack({ ...editedTrack, [field]: value });
    setHasUnsavedChanges(true);
  };
  
  // Parse comma-separated values into array
  const parseMultiValue = (value: string | undefined): string[] => {
    if (!value) return [];
    return value.split(',').map(v => v.trim()).filter(v => v);
  };
  
  // Toggle a value in a multi-select field
  const toggleMultiValue = (field: 'timeSignature' | 'genre' | 'mood', value: string) => {
    const currentValues = parseMultiValue(editedTrack[field]);
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleFieldChange(field, newValues.join(', '));
  };
  
  // Tag management
  const addTag = (tag: string) => {
    if (tag.trim() && !editedTrack.tags?.includes(tag)) {
      const newTags = [...(editedTrack.tags || []), tag];
      handleFieldChange('tags', newTags);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    const newTags = (editedTrack.tags || []).filter(tag => tag !== tagToRemove);
    handleFieldChange('tags', newTags);
  };
  
  // Get all available tags
  const usedTags = getAllUsedTags().map(({ tag }) => tag);
  const allTags = [...new Set([...PREDEFINED_TAGS, ...usedTags])];
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !currentTrack?.tags?.includes(tag)
  );
  const isNewTag = tagInput.trim() && 
    !allTags.some(tag => tag.toLowerCase() === tagInput.toLowerCase()) &&
    tagInput.length > 1;
    
  // Add a new timestamped note
  const addNote = () => {
    if (newNoteInput.trim() && currentTrack) {
      const timestamp = new Date().toLocaleString();
      const newNote = `[${timestamp}] ${newNoteInput.trim()}`;
      
      // Parse existing notes to preserve extended metadata
      const trackNotes = parseTrackNotes(currentTrack.notes);
      const existingNotes = trackNotes.notes || '';
      
      // Add new note at the beginning for chronological order with latest first
      trackNotes.notes = existingNotes ? `${newNote}\n\n${existingNotes}` : newNote;
      
      updateTrack(currentTrack.id, { notes: stringifyTrackNotes(trackNotes) });
      setNewNoteInput('');
    }
  };
  
  // Delete a note with confirmation
  const deleteNote = (index: number) => {
    if (!currentTrack || !currentTrack.notes) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;
    
    // Parse existing notes to preserve extended metadata
    const trackNotes = parseTrackNotes(currentTrack.notes);
    const notes = parseNotes(trackNotes.notes);
    notes.splice(index, 1);
    
    // Rebuild the notes string
    trackNotes.notes = notes
      .map(note => `[${note.timestamp}] ${note.content}`)
      .join('\n\n');
    
    updateTrack(currentTrack.id, { notes: stringifyTrackNotes(trackNotes) });
  };
  
  // Parse notes into structured format for display
  const parseNotes = (notesString: string | undefined) => {
    if (!notesString) return [];
    
    // Split by double newlines or by timestamp pattern
    const noteRegex = /\[([^\]]+)\]\s*(.+?)(?=\n\n\[|$)/gs;
    const notes = [];
    let match;
    
    while ((match = noteRegex.exec(notesString)) !== null) {
      notes.push({
        timestamp: match[1],
        content: match[2].trim()
      });
    }
    
    // Handle notes without timestamps
    if (notes.length === 0 && notesString.trim()) {
      notes.push({
        timestamp: 'Earlier',
        content: notesString.trim()
      });
    }
    
    return notes;
  };
  
  // Get plain notes without metadata
  const getPlainNotes = () => {
    const trackNotes = parseTrackNotes(currentTrack.notes);
    return trackNotes.notes || '';
  };

  return (
    <div className="h-full flex flex-col bg-forest-main">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-forest-light">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={onClose}
            className="p-2 hover:bg-forest-light rounded-lg transition-colors"
            title="Close details"
          >
            <ChevronLeft className="w-5 h-5 text-silver" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-anton text-2xl text-silver truncate">{currentTrack.name}</h2>
            {currentTrack.artist && (
              <p className="font-quicksand text-sm text-silver/60 truncate">{currentTrack.artist}</p>
            )}
          </div>
          
          {/* Rating Buttons in Header */}
          <div className="flex items-center space-x-2 mr-2">
            <button 
              onClick={() => updateTrack(currentTrack.id, { listened: !currentTrack.listened })}
              className={`p-2 rounded-lg transition-colors ${
                currentTrack.listened 
                  ? 'bg-accent-yellow/20 text-accent-yellow' 
                  : 'hover:bg-forest-light text-silver/40 hover:text-silver'
              }`}
              title="Mark as listened"
            >
              <Headphones className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => updateTrack(currentTrack.id, { liked: !currentTrack.liked })}
              className={`p-2 rounded-lg transition-colors ${
                currentTrack.liked 
                  ? 'bg-accent-yellow/20 text-accent-yellow' 
                  : 'hover:bg-forest-light text-silver/40 hover:text-silver'
              }`}
              title="Like"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => updateTrack(currentTrack.id, { loved: !currentTrack.loved })}
              className={`p-2 rounded-lg transition-colors ${
                currentTrack.loved 
                  ? 'bg-accent-coral/20 text-accent-coral' 
                  : 'hover:bg-forest-light text-silver/40 hover:text-silver'
              }`}
              title="Love"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Waveform Section */}
        <div className="p-6 border-b border-forest-light">
          <h3 className="font-anton text-sm text-silver uppercase tracking-wider mb-4">Waveform</h3>
          
          {/* Waveform */}
          {currentTrack.url ? (
            <DetailedWaveform
              audioUrl={currentTrack.url}
              trackId={currentTrack.id}
              height={120}
              onSeek={seek}
              showTimeline={true}
            />
          ) : (
            <div className="flex items-center justify-center h-[120px] bg-forest-main rounded-lg">
              <p className="text-silver/60 font-quicksand text-sm">No audio URL available</p>
            </div>
          )}
          
          {/* Playback Controls and Volume */}
          <div className="flex items-center justify-between mt-4">
            {/* Playback Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => seek(Math.max(0, currentTime - 10))}
                className="p-2 hover:bg-forest-light rounded-lg transition-colors text-silver/60 hover:text-silver"
                title="Rewind 10 seconds"
              >
                <Rewind className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  if (isCurrentlyPlaying) {
                    pause();
                  } else {
                    play(currentTrack.id, currentTrack.url);
                  }
                }}
                className="p-3 bg-accent-yellow text-forest-dark rounded-full hover:bg-accent-yellow/90 transition-colors"
                title={isCurrentlyPlaying ? "Pause" : "Play"}
              >
                {isCurrentlyPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>
              
              <button
                onClick={() => seek(Math.min(currentTrack.duration, currentTime + 10))}
                className="p-2 hover:bg-forest-light rounded-lg transition-colors text-silver/60 hover:text-silver"
                title="Forward 10 seconds"
              >
                <FastForward className="w-5 h-5" />
              </button>
            </div>
            
            {/* Volume Control - moved closer to playback controls */}
            <div className="flex items-center space-x-3">
              <div className="w-px h-8 bg-forest-light/50" /> {/* Divider */}
              <Volume2 className="w-4 h-4 text-silver/60" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-forest-light rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #F9E05F 0%, #F9E05F ${volume * 100}%, #243830 ${volume * 100}%, #243830 100%)`
                }}
              />
              <span className="text-xs text-silver/60 font-mono">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Track Information */}
        <div className="p-6 border-b border-forest-light">
          <div className="flex gap-4">
            {/* Track Information - 2/3 width */}
            <div className="flex-[2] border-2 border-accent-yellow rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider">Track Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-forest-light rounded-lg transition-colors"
                    title="Edit track details"
                  >
                    <Edit2 className="w-4 h-4 text-silver/60 hover:text-silver" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSave(editedTrack)}
                      className="p-1.5 hover:bg-forest-light rounded-lg transition-colors text-accent-yellow"
                      title="Save changes"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 hover:bg-forest-light rounded-lg transition-colors text-accent-coral"
                      title="Cancel editing"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-3">
                  {/* Edit mode fields - same order as view mode */}
                  <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-x-4 gap-y-3 items-center">
                    {/* Row 1 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Title:</p>
                    <input
                      type="text"
                      value={editedTrack.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                    />
                    <p className="font-quicksand text-xs text-silver/60 text-right">Album:</p>
                    <input
                      type="text"
                      value={editedTrack.collection || ''}
                      onChange={(e) => handleFieldChange('collection', e.target.value)}
                      className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                    />
                    
                    {/* Row 2 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Artist:</p>
                    <input
                      type="text"
                      value={editedTrack.artist || ''}
                      onChange={(e) => handleFieldChange('artist', e.target.value)}
                      className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                    />
                    <p className="font-quicksand text-xs text-silver/60 text-right">Type:</p>
                    <select
                      value={editedTrack.category}
                      onChange={(e) => handleFieldChange('category', e.target.value as TrackCategory)}
                      className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                    >
                      <option value="songs">Songs</option>
                      <option value="final-versions">Final Versions</option>
                      <option value="live-performances">Live Performances</option>
                      <option value="demos">Recordings</option>
                      <option value="ideas">Ideas</option>
                      <option value="voice-memos">Voice Memos</option>
                    </select>
                    
                    {/* Row 3 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Key:</p>
                    <select
                      value={editedTrack.key || ''}
                      onChange={(e) => handleFieldChange('key', e.target.value || undefined)}
                      className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                    >
                      <option value="">Select key...</option>
                      {KEY_OPTIONS.map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <p className="font-quicksand text-xs text-silver/60 text-right">Tempo:</p>
                    <input
                      type="number"
                      value={editedTrack.tempo || ''}
                      onChange={(e) => handleFieldChange('tempo', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="BPM"
                      className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                    />
                    
                    {/* Row 4 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Tuning:</p>
                    <input
                      type="text"
                      value={editedTrack.tuning || ''}
                      onChange={(e) => handleFieldChange('tuning', e.target.value || undefined)}
                      placeholder="e.g. Drop D, DADGAD"
                      className="bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                    />
                    <p className="font-quicksand text-xs text-silver/60 text-right">Time Sig:</p>
                    <MultiSelect
                      value={editedTrack.timeSignature}
                      options={timeSignatureOptions}
                      onChange={(val) => handleFieldChange('timeSignature', val)}
                      onToggle={(opt) => toggleMultiValue('timeSignature', opt)}
                      placeholder="Select time signatures..."
                      showDropdown={showTimeSignatureDropdown}
                      setShowDropdown={setShowTimeSignatureDropdown}
                    />
                    
                    {/* Row 5 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Genre:</p>
                    <MultiSelect
                      value={editedTrack.genre}
                      options={GENRE_OPTIONS}
                      onChange={(val) => handleFieldChange('genre', val)}
                      onToggle={(opt) => toggleMultiValue('genre', opt)}
                      placeholder="Select genres..."
                      showDropdown={showGenreDropdown}
                      setShowDropdown={setShowGenreDropdown}
                    />
                    <p className="font-quicksand text-xs text-silver/60 text-right">Mood:</p>
                    <MultiSelect
                      value={editedTrack.mood}
                      options={moodOptions}
                      onChange={(val) => handleFieldChange('mood', val)}
                      onToggle={(opt) => toggleMultiValue('mood', opt)}
                      placeholder="Select moods..."
                      showDropdown={showMoodDropdown}
                      setShowDropdown={setShowMoodDropdown}
                    />
                    
                    {/* Row 6 - Duration is read-only, so just show in view mode */}
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Display mode - reorganized columns */}
                  <div className="grid grid-cols-[100px_1fr_100px_1fr] gap-x-4 gap-y-3 items-baseline">
                    {/* Row 1 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Title:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.name}</p>
                    <p className="font-quicksand text-xs text-silver/60 text-right">Album:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.collection || '—'}</p>
                    
                    {/* Row 2 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Artist:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.artist || '—'}</p>
                    <p className="font-quicksand text-xs text-silver/60 text-right">Type:</p>
                    <p className="font-quicksand text-sm text-silver capitalize">
                      {currentTrack.category.replace('-', ' ')}
                    </p>
                    
                    {/* Row 3 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Key:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.key || '—'}</p>
                    <p className="font-quicksand text-xs text-silver/60 text-right">Tempo:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.tempo ? `${currentTrack.tempo} BPM` : '—'}</p>
                    
                    {/* Row 4 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Tuning:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.tuning || '—'}</p>
                    <p className="font-quicksand text-xs text-silver/60 text-right">Time Sig:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.timeSignature || '—'}</p>
                    
                    {/* Row 5 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Genre:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.genre || '—'}</p>
                    <p className="font-quicksand text-xs text-silver/60 text-right">Mood:</p>
                    <p className="font-quicksand text-sm text-silver">{currentTrack.mood || '—'}</p>
                    
                    {/* Row 6 */}
                    <p className="font-quicksand text-xs text-silver/60 text-right">Duration:</p>
                    <p className="font-quicksand text-sm text-silver">
                      {Math.floor(currentTrack.duration / 60)}:{Math.floor(currentTrack.duration % 60).toString().padStart(2, '0')}
                    </p>
                    <div></div>
                    <div></div>
                  </div>

                </div>
              )}
            </div>

            {/* Tags - 1/3 width - Always editable */}
            <div className="flex-1 border-2 border-accent-yellow rounded-lg p-4">
              <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">Tags</h3>
              <div className="space-y-3">
                {/* Existing tags with remove buttons */}
                {currentTrack.tags && currentTrack.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentTrack.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-forest-light rounded-full text-xs text-silver flex items-center space-x-1 group hover:bg-forest-light/80"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => {
                            const newTags = currentTrack.tags.filter(t => t !== tag);
                            updateTrack(currentTrack.id, { tags: newTags });
                          }}
                          className="text-silver/60 hover:text-accent-coral transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Add new tag input - Always visible */}
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        const newTag = tagInput.trim();
                        if (!currentTrack.tags?.includes(newTag)) {
                          updateTrack(currentTrack.id, { 
                            tags: [...(currentTrack.tags || []), newTag] 
                          });
                          setTagInput('');
                        }
                      }
                    }}
                    placeholder="Add tag..."
                    className="w-full bg-forest-light border border-forest-light rounded px-2 py-1 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  />
                  
                  {/* Tag suggestions dropdown */}
                  {showTagSuggestions && (filteredTags.length > 0 || isNewTag) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-forest-main border border-forest-light rounded-lg shadow-xl z-[100] max-h-40 overflow-y-auto">
                      {filteredTags.slice(0, 8).map(tag => (
                        <button
                          key={tag}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (!currentTrack.tags?.includes(tag)) {
                              updateTrack(currentTrack.id, { 
                                tags: [...(currentTrack.tags || []), tag] 
                              });
                              setTagInput('');
                            }
                          }}
                          className="w-full text-left px-3 py-2 font-quicksand text-sm text-silver hover:bg-forest-light/50 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                      {isNewTag && (
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const newTag = tagInput.trim();
                            updateTrack(currentTrack.id, { 
                              tags: [...(currentTrack.tags || []), newTag] 
                            });
                            setTagInput('');
                          }}
                          className="w-full text-left px-3 py-2 font-quicksand text-sm text-accent-yellow hover:bg-forest-light/50 transition-colors flex items-center space-x-2"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Create "{tagInput}"</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Metadata and Lyrics Section */}
        <div className="p-6 border-b border-forest-light">
          <div className="flex gap-4">
            {/* Extended Metadata - 2/3 width */}
            <div className="flex-[2] border-2 border-accent-yellow rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider">Extended Metadata</h3>
                {!isEditingExtended ? (
                  <button
                    onClick={() => setIsEditingExtended(true)}
                    className="p-1.5 hover:bg-forest-light rounded-lg transition-colors"
                    title="Edit extended metadata"
                  >
                    <Edit2 className="w-4 h-4 text-silver/60 hover:text-silver" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setIsEditingExtended(false);
                        setHasUnsavedChanges(false);
                      }}
                      className="p-1.5 hover:bg-forest-light rounded-lg transition-colors text-accent-yellow"
                      title="Save changes"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditedTrack(currentTrack);
                        setIsEditingExtended(false);
                        setHasUnsavedChanges(false);
                      }}
                      className="p-1.5 hover:bg-forest-light rounded-lg transition-colors text-accent-coral"
                      title="Cancel editing"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <ExpandedMetadataEditor
                track={currentTrack}
                editedTrack={editedTrack}
                onFieldChange={handleFieldChange}
                isEditing={isEditingExtended}
              />
            </div>

            {/* Lyrics - 1/3 width */}
            <div className="flex-1 border-2 border-accent-yellow rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider">Lyrics</h3>
                {!isEditingLyrics ? (
                  <button
                    onClick={() => setIsEditingLyrics(true)}
                    className="p-1.5 hover:bg-forest-light rounded-lg transition-colors"
                    title="Edit lyrics"
                  >
                    <Edit2 className="w-4 h-4 text-silver/60 hover:text-silver" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const trackNotes = parseTrackNotes(editedTrack.notes);
                        trackNotes.extended = trackNotes.extended || {};
                        const updatedNotes = stringifyTrackNotes(trackNotes);
                        updateTrack(currentTrack.id, { notes: updatedNotes });
                        setIsEditingLyrics(false);
                      }}
                      className="p-1.5 hover:bg-forest-light rounded-lg transition-colors text-accent-yellow"
                      title="Save changes"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditedTrack(currentTrack);
                        setIsEditingLyrics(false);
                      }}
                      className="p-1.5 hover:bg-forest-light rounded-lg transition-colors text-accent-coral"
                      title="Cancel editing"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Lyrics content */}
              {isEditingLyrics ? (
                <textarea
                  value={getExtendedValue(editedTrack.notes, 'lyrics') || ''}
                  onChange={(e) => {
                    const updatedNotes = setExtendedValue(editedTrack.notes, 'lyrics', e.target.value);
                    handleFieldChange('notes', updatedNotes);
                  }}
                  placeholder="Enter lyrics..."
                  className="w-full h-64 bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow resize-none"
                />
              ) : (
                <div className="font-quicksand text-sm text-silver whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {getExtendedValue(currentTrack.notes, 'lyrics') || (
                    <span className="text-silver/40 italic">No lyrics added</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes and Tasks Section */}
        <div className="p-6 border-b border-forest-light">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Notes - Left side */}
            <div className="border-2 border-accent-yellow rounded-lg p-4 overflow-hidden">
              <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">Notes</h3>
              
              {/* Add new note input at the top */}
              <div className="mb-4">
                <textarea
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                  placeholder="Add a note... (Press Enter to save, Shift+Enter for new line)"
                  rows={2}
                  className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={addNote}
                    disabled={!newNoteInput.trim()}
                    className="px-4 py-1.5 bg-accent-yellow text-forest-dark rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Note
                  </button>
                </div>
              </div>
              
              {/* Existing notes display with elegant design */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {parseNotes(getPlainNotes()).map((note, index) => (
                  <div key={index} className="bg-forest-light/50 rounded-lg p-3 border border-forest-light hover:border-forest-light/80 transition-colors relative group">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-quicksand text-xs text-silver/60">{note.timestamp}</span>
                      <button
                        onClick={() => deleteNote(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-silver/40 hover:text-accent-coral p-1 -m-1"
                        title="Delete note"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-quicksand text-sm text-silver whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
                
                {!getPlainNotes() && (
                  <p className="font-quicksand text-sm text-silver/40 text-center py-4">No notes yet</p>
                )}
              </div>
            </div>

            {/* Tasks - Middle */}
            <TasksList trackId={currentTrack.id} />
            
            {/* Detailed Ratings - Right side */}
            <DetailedRatings track={currentTrack} />
          </div>
          
          {/* Comments - Full width below Notes, Tasks, and Detailed Ratings */}
          {playlistId && currentTrack && (
            <div className="mt-6">
              <TrackComments 
                trackId={currentTrack.id}
                playlistId={playlistId}
                playlistName={
                  playlists.find(p => p.id === playlistId)?.name || 
                  sharedPlaylists.find(p => p.id === playlistId)?.name
                }
                isSharedPlaylist={sharedPlaylists.some(p => p.id === playlistId)}
              />
            </div>
          )}
        </div>



        {/* Version History */}
        <div className="p-6 border-b border-forest-light">
          <h3 className="font-anton text-sm text-silver uppercase tracking-wider mb-4">Version History</h3>
          <div className="bg-forest-light/30 rounded-lg p-8 text-center">
            <p className="font-quicksand text-lg text-silver/60 mb-2">Feature Coming Soon</p>
            <p className="font-quicksand text-sm text-silver/40">Track version history and variations will be available in a future update</p>
          </div>
        </div>

        {/* Arrangements */}
        <div className="p-6">
          <h3 className="font-anton text-sm text-silver uppercase tracking-wider mb-4">Arrangements</h3>
          <div className="bg-forest-light/30 rounded-lg p-8 text-center">
            <p className="font-quicksand text-lg text-silver/60 mb-2">Feature Coming Soon</p>
            <p className="font-quicksand text-sm text-silver/40">Song arrangement and section editing will be available in a future update</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDetailsPanel;