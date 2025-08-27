import React, { useState } from 'react';
import { X, Save, Music, Tag, Plus } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { PREDEFINED_TAGS, getTagColor } from '../../utils/tags';
import { useLibrary } from '../../contexts/LibraryContext';
import { GENRE_OPTIONS, KEY_OPTIONS } from '../../constants/musicData';

interface TrackMetadataEditorProps {
  track: Track;
  onSave: (trackId: string, metadata: Partial<Track>) => void;
  onClose: () => void;
}

const TrackMetadataEditor: React.FC<TrackMetadataEditorProps> = ({ 
  track, 
  onSave, 
  onClose 
}) => {
  const { getAllUsedTags } = useLibrary();
  const [metadata, setMetadata] = useState({
    name: track.name || '',
    category: track.category || 'songs',
    artist: track.artist || '',
    collection: track.collection || '',
    key: track.key || '',
    tempo: track.tempo?.toString() || '',
    timeSignature: track.timeSignature || '',
    mood: track.mood || '',
    genre: track.genre || '',
    notes: track.notes || '',
  });
  
  const [selectedTags, setSelectedTags] = useState<string[]>(track.tags || []);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const handleSave = () => {
    const updates: Partial<Track> = {
      name: metadata.name || track.name,
      category: metadata.category as TrackCategory,
      artist: metadata.artist || undefined,
      collection: metadata.collection || undefined,
      key: metadata.key || undefined,
      tempo: metadata.tempo ? parseInt(metadata.tempo) : undefined,
      timeSignature: metadata.timeSignature || undefined,
      mood: metadata.mood || undefined,
      genre: metadata.genre || undefined,
      notes: metadata.notes || undefined,
      tags: selectedTags,
    };

    onSave(track.id, updates);
    onClose();
  };

  const keyOptions = [
    'C Major', 'C Minor', 'C# Major', 'C# Minor',
    'D Major', 'D Minor', 'D# Major', 'D# Minor',
    'E Major', 'E Minor', 'F Major', 'F Minor',
    'F# Major', 'F# Minor', 'G Major', 'G Minor',
    'G# Major', 'G# Minor', 'A Major', 'A Minor',
    'A# Major', 'A# Minor', 'B Major', 'B Minor'
  ];

  const timeSignatureOptions = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8'];

  const moodOptions = [
    'Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Peaceful',
    'Melancholic', 'Upbeat', 'Dark', 'Bright', 'Mysterious', 'Romantic'
  ];

  
  // Get all available tags
  const usedTags = getAllUsedTags().map(({ tag }) => tag);
  const allTags = [...new Set([...PREDEFINED_TAGS, ...usedTags])];
  
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !selectedTags.includes(tag)
  );
  
  const isNewTag = tagSearchQuery.trim() && 
    !allTags.some(tag => tag.toLowerCase() === tagSearchQuery.toLowerCase()) &&
    tagSearchQuery.length > 1;
  
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagSearchQuery('');
    }
  };
  
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-forest-main rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-accent-yellow" />
            <h3 className="font-anton text-lg text-silver">Edit Track Metadata</h3>
          </div>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="font-quicksand text-sm text-silver/80">
            Edit track information to help organize and find similar tracks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Track Title */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Track Title
            </label>
            <input
              type="text"
              value={metadata.name}
              onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder="Track title"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Artist
            </label>
            <input
              type="text"
              value={metadata.artist}
              onChange={(e) => setMetadata(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder="Artist name"
            />
          </div>

          {/* Album */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Album
            </label>
            <input
              type="text"
              value={metadata.collection}
              onChange={(e) => setMetadata(prev => ({ ...prev, collection: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder="Album"
            />
          </div>

          {/* Type/Category */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Type
            </label>
            <select
              value={metadata.category}
              onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="songs">Songs</option>
              <option value="final-versions">Final Versions</option>
              <option value="live-performances">Live Performances</option>
              <option value="demos">Recordings</option>
              <option value="ideas">Ideas</option>
              <option value="voice-memos">Voice Memos</option>
            </select>
          </div>

          {/* Key */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Key
            </label>
            <select
              value={metadata.key}
              onChange={(e) => setMetadata(prev => ({ ...prev, key: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">Select key...</option>
              {keyOptions.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>

          {/* Tempo */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Tempo (BPM)
            </label>
            <input
              type="number"
              min="60"
              max="200"
              value={metadata.tempo}
              onChange={(e) => setMetadata(prev => ({ ...prev, tempo: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder="e.g. 120"
            />
          </div>

          {/* Time Signature */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Time Signature
            </label>
            <select
              value={metadata.timeSignature}
              onChange={(e) => setMetadata(prev => ({ ...prev, timeSignature: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">Select time signature...</option>
              {timeSignatureOptions.map(sig => (
                <option key={sig} value={sig}>{sig}</option>
              ))}
            </select>
          </div>

          {/* Empty placeholder */}
          <div></div>

          {/* Genre */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Genre
            </label>
            <select
              value={metadata.genre}
              onChange={(e) => setMetadata(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">Select genre...</option>
              {GENRE_OPTIONS.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Mood
            </label>
            <select
              value={metadata.mood}
              onChange={(e) => setMetadata(prev => ({ ...prev, mood: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">Select mood...</option>
              {moodOptions.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block font-quicksand text-sm text-silver/80 mb-2">
            Notes
          </label>
          <textarea
            value={metadata.notes}
            onChange={(e) => setMetadata(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow resize-none"
            placeholder="Add any notes about this track..."
          />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block font-quicksand text-sm text-silver/80 mb-2 flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Tags</span>
          </label>
          
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-silver ${getTagColor(tag)}`}
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Tag Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search or create tags..."
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              onFocus={() => setShowTagDropdown(true)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            />
            
            {/* Tag Dropdown */}
            {showTagDropdown && (tagSearchQuery || filteredTags.length > 0) && (
              <div className="absolute top-full mt-1 w-full bg-forest-main border border-forest-light rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {/* Create new tag */}
                {isNewTag && (
                  <button
                    onClick={() => {
                      addTag(tagSearchQuery);
                      setShowTagDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-accent-yellow/20 text-left transition-colors border-b border-forest-light"
                  >
                    <Plus className="w-3 h-3 text-accent-yellow" />
                    <span className="font-quicksand text-sm text-accent-yellow">
                      Create "{tagSearchQuery}"
                    </span>
                  </button>
                )}
                
                {/* Existing tags */}
                {filteredTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      addTag(tag);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-forest-light text-left transition-colors"
                  >
                    <Plus className="w-3 h-3 text-silver/60" />
                    <span className="font-quicksand text-sm text-silver">{tag}</span>
                  </button>
                ))}
                
                {filteredTags.length === 0 && !isNewTag && (
                  <div className="px-3 py-2 text-center">
                    <p className="font-quicksand text-sm text-silver/60">
                      No tags found
                    </p>
                    {tagSearchQuery.length < 2 && (
                      <p className="font-quicksand text-xs text-silver/40 mt-1">
                        Type at least 2 characters to create
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Click outside to close dropdown */}
          {showTagDropdown && (
            <div 
              className="fixed inset-0 z-0" 
              onClick={() => setShowTagDropdown(false)}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Metadata</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackMetadataEditor;