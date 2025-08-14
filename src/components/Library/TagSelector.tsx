import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { PREDEFINED_TAGS, getTagColor } from '../../utils/tags';
import { useLibrary } from '../../contexts/LibraryContext';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onClose: () => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onTagsChange, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { getAllUsedTags } = useLibrary();
  
  // Combine predefined tags with user-created tags
  const usedTags = getAllUsedTags().map(({ tag }) => tag);
  const allTags = [...new Set([...PREDEFINED_TAGS, ...usedTags])];

  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTags.includes(tag)
  );
  
  // Check if searchQuery is a new tag
  const isNewTag = searchQuery.trim() && 
    !allTags.some(tag => tag.toLowerCase() === searchQuery.toLowerCase()) &&
    searchQuery.length > 1;

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-forest-main rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-accent-yellow" />
            <h3 className="font-anton text-lg text-silver">Add Tags</h3>
          </div>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <p className="font-quicksand text-sm text-silver/80 mb-2">Selected tags:</p>
            <div className="flex flex-wrap gap-2">
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
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
          />
        </div>

        {/* Available Tags */}
        <div className="max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {/* Create new tag option */}
            {isNewTag && (
              <button
                onClick={() => {
                  addTag(searchQuery);
                  setSearchQuery('');
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 bg-accent-yellow/20 hover:bg-accent-yellow/30 rounded-lg text-left transition-colors group border border-accent-yellow/50"
              >
                <Plus className="w-3 h-3 text-accent-yellow" />
                <span className="font-quicksand text-sm text-accent-yellow">
                  Create new tag "{searchQuery}"
                </span>
              </button>
            )}
            
            {/* Existing tags grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredTags.map(tag => {
                const isPredefined = PREDEFINED_TAGS.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="flex items-center space-x-2 px-3 py-2 bg-forest-light hover:bg-forest-light/80 rounded-lg text-left transition-colors group"
                  >
                    <Plus className="w-3 h-3 text-silver/60 group-hover:text-accent-yellow" />
                    <span className="font-quicksand text-sm text-silver">{tag}</span>
                    {!isPredefined && (
                      <span className="text-xs text-silver/40 ml-auto">custom</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {filteredTags.length === 0 && searchQuery && !isNewTag && (
            <div className="text-center py-8">
              <p className="font-quicksand text-sm text-silver/60">
                No tags found matching "{searchQuery}"
              </p>
              <p className="font-quicksand text-xs text-silver/40 mt-1">
                Type at least 2 characters to create a new tag
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-forest-light">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagSelector;