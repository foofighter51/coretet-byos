import React, { useState } from 'react';
import { X, Save, Music, Tag, Plus } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { PREDEFINED_TAGS, getTagColor } from '../../utils/tags';
import { useLibrary } from '../../contexts/LibraryContext';
import { GENRE_OPTIONS, KEY_OPTIONS } from '../../constants/musicData';

interface BulkEditModalProps {
  tracks: Track[];
  onSave: (updates: Partial<Track>) => void;
  onClose: () => void;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ tracks, onSave, onClose }) => {
  const { getAllUsedTags } = useLibrary();
  
  // Check if all selected tracks have the same value for a field
  const getCommonValue = <T extends keyof Track>(field: T): Track[T] | undefined => {
    if (tracks.length === 0) return undefined;
    const firstValue = tracks[0][field];
    const allSame = tracks.every(track => track[field] === firstValue);
    return allSame ? firstValue : undefined;
  };
  
  // Initialize metadata fields with common values if they exist
  const [category, setCategory] = useState(getCommonValue('category') || '');
  const [artist, setArtist] = useState(getCommonValue('artist') || '');
  const [collection, setCollection] = useState(getCommonValue('collection') || '');
  const [genre, setGenre] = useState(getCommonValue('genre') || '');
  const [mood, setMood] = useState(getCommonValue('mood') || '');
  const [key, setKey] = useState(getCommonValue('key') || '');
  const [tempo, setTempo] = useState(getCommonValue('tempo')?.toString() || '');
  const [timeSignature, setTimeSignature] = useState(getCommonValue('timeSignature') || '');
  
  // Tags
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  
  // Get all available tags
  const usedTags = getAllUsedTags().map(({ tag }) => tag);
  const allTags = [...new Set([...PREDEFINED_TAGS, ...usedTags])];
  
  // Get all unique tags from selected tracks with their usage count
  const getExistingTags = () => {
    const tagMap = new Map<string, number>();
    tracks.forEach(track => {
      track.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries()).map(([tag, count]) => ({
      tag,
      count,
      isOnAll: count === tracks.length
    }));
  };
  
  const existingTags = getExistingTags();
  
  // Tags to add and remove
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !tagsToAdd.includes(tag) &&
    !existingTags.some(et => et.tag === tag)
  );
  
  const isNewTag = tagSearchQuery.trim() && 
    !allTags.some(tag => tag.toLowerCase() === tagSearchQuery.toLowerCase()) &&
    tagSearchQuery.length > 1;

  const handleSave = () => {
    const updates: Partial<Track> = {};
    
    // Only include fields that have values
    if (category) updates.category = category as TrackCategory;
    if (artist) updates.artist = artist;
    if (collection) updates.collection = collection;
    if (genre) updates.genre = genre;
    if (mood) updates.mood = mood;
    if (key) updates.key = key;
    if (tempo) updates.tempo = parseInt(tempo);
    if (timeSignature) updates.timeSignature = timeSignature;
    
    // Handle tags
    if (tagsToAdd.length > 0) {
      (updates as any).tagsToAdd = tagsToAdd;
    }
    if (tagsToRemove.length > 0) {
      (updates as any).tagsToRemove = tagsToRemove;
    }
    
    onSave(updates);
  };

  const toggleAddTag = (tag: string) => {
    if (tagsToAdd.includes(tag)) {
      setTagsToAdd(tagsToAdd.filter(t => t !== tag));
    } else {
      setTagsToAdd([...tagsToAdd, tag]);
      // Remove from remove list if it was there
      setTagsToRemove(tagsToRemove.filter(t => t !== tag));
    }
    setTagSearchQuery('');
  };

  const toggleRemoveTag = (tag: string) => {
    if (tagsToRemove.includes(tag)) {
      setTagsToRemove(tagsToRemove.filter(t => t !== tag));
    } else {
      setTagsToRemove([...tagsToRemove, tag]);
      // Remove from add list if it was there
      setTagsToAdd(tagsToAdd.filter(t => t !== tag));
    }
  };


  const moodOptions = [
    'Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Peaceful',
    'Melancholic', 'Upbeat', 'Dark', 'Bright', 'Mysterious', 'Romantic'
  ];
  
  const keyOptions = [
    'C Major', 'C Minor', 'C# Major', 'C# Minor',
    'D Major', 'D Minor', 'D# Major', 'D# Minor',
    'E Major', 'E Minor', 'F Major', 'F Minor',
    'F# Major', 'F# Minor', 'G Major', 'G Minor',
    'G# Major', 'G# Minor', 'A Major', 'A Minor',
    'A# Major', 'A# Minor', 'B Major', 'B Minor'
  ];
  
  const timeSignatureOptions = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-forest-main rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-accent-yellow" />
            <h3 className="font-anton text-lg text-silver">
              {tracks.length === 1 ? tracks[0].name : `Edit ${tracks.length} tracks`}
            </h3>
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
            Editing {tracks.length} track{tracks.length !== 1 ? 's' : ''}. Fields show current values when all tracks match.
            {tracks.length > 1 && <><br />Fields marked "(Multiple values)" have different values across selected tracks.</>}
          </p>
        </div>

        {/* Basic Metadata - matching TrackMetadataEditor layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Artist */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Artist
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder={getCommonValue('artist') === undefined && tracks.some(t => t.artist) ? "(Multiple values)" : "Enter artist..."}
            />
          </div>

          {/* Album */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Album
            </label>
            <input
              type="text"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder={getCommonValue('collection') === undefined && tracks.some(t => t.collection) ? "(Multiple values)" : "Enter album..."}
            />
          </div>

          {/* Type/Category */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">{getCommonValue('category') === undefined ? "(Multiple values)" : "Select type..."}</option>
              <option value="songs">Songs</option>
              <option value="final-versions">Final Versions</option>
              <option value="live-performances">Live Performances</option>
              <option value="demos">Demos</option>
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
              value={key || ''}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">{getCommonValue('key') === undefined && tracks.some(t => t.key) ? "(Multiple values)" : "Select key..."}</option>
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
              value={tempo || ''}
              onChange={(e) => setTempo(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder={getCommonValue('tempo') === undefined && tracks.some(t => t.tempo) ? "(Multiple values)" : "Enter tempo..."}
            />
          </div>

          {/* Time Signature */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Time Signature
            </label>
            <select
              value={timeSignature || ''}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">{getCommonValue('timeSignature') === undefined && tracks.some(t => t.timeSignature) ? "(Multiple values)" : "Select time signature..."}</option>
              {timeSignatureOptions.map(sig => (
                <option key={sig} value={sig}>{sig}</option>
              ))}
            </select>
          </div>

          {/* Genre */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">{getCommonValue('genre') === undefined && tracks.some(t => t.genre) ? "(Multiple values)" : "Select genre..."}</option>
              {GENRE_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">
              Mood
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">{getCommonValue('mood') === undefined && tracks.some(t => t.mood) ? "(Multiple values)" : "Select mood..."}</option>
              {moodOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="font-quicksand font-semibold text-silver flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>Tags</span>
            </h4>
          </div>

          {/* Existing Tags from Selected Tracks */}
          {existingTags.length > 0 && (
            <div className="space-y-2">
              <p className="font-quicksand text-xs text-silver/60">
                Existing tags on selected tracks:
              </p>
              <div className="flex flex-wrap gap-2">
                {existingTags.map(({ tag, count, isOnAll }) => {
                  const isBeingRemoved = tagsToRemove.includes(tag);
                  const isBeingAdded = tagsToAdd.includes(tag);
                  
                  return (
                    <div
                      key={tag}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
                        isBeingRemoved 
                          ? 'bg-accent-coral/20 text-accent-coral' 
                          : isBeingAdded
                          ? 'bg-accent-yellow/20 text-accent-yellow'
                          : 'bg-forest-light text-silver'
                      }`}
                    >
                      <span className="font-quicksand">
                        {tag} 
                        {tracks.length > 1 && (
                          <span className="text-xs opacity-60 ml-1">
                            ({count}/{tracks.length})
                          </span>
                        )}
                      </span>
                      <div className="flex items-center space-x-1">
                        {!isOnAll && (
                          <button
                            onClick={() => toggleAddTag(tag)}
                            className={`p-1 rounded hover:bg-white/10 transition-colors ${
                              isBeingAdded ? 'text-accent-yellow' : 'text-silver/60 hover:text-accent-yellow'
                            }`}
                            title="Apply to all selected tracks"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleRemoveTag(tag)}
                          className={`p-1 rounded hover:bg-white/10 transition-colors ${
                            isBeingRemoved ? 'text-accent-coral' : 'text-silver/60 hover:text-accent-coral'
                          }`}
                          title="Remove from all tracks"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags to Add */}
          {tagsToAdd.length > 0 && (
            <div className="space-y-2">
              <p className="font-quicksand text-xs text-accent-yellow">
                Tags to add to all tracks:
              </p>
              <div className="flex flex-wrap gap-2">
                {tagsToAdd.filter(tag => !existingTags.some(et => et.tag === tag)).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-accent-yellow/20 rounded-full text-sm text-accent-yellow"
                  >
                    <span className="font-quicksand">{tag}</span>
                    <button
                      onClick={() => toggleAddTag(tag)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tag Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search or create new tags..."
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
                      toggleAddTag(tagSearchQuery);
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
                      toggleAddTag(tag);
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
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;