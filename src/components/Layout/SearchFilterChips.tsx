import React from 'react';
import { X, Tag, Folder, Heart, Hash } from 'lucide-react';

interface SearchFilterChipsProps {
  searchQuery?: string;
  selectedTags: string[];
  selectedCollection?: string | null;
  selectedRating?: 'listened' | 'liked' | 'loved' | null;
  onRemoveSearch?: () => void;
  onRemoveTag: (tag: string) => void;
  onRemoveCollection?: () => void;
  onRemoveRating?: () => void;
}

const SearchFilterChips: React.FC<SearchFilterChipsProps> = ({
  searchQuery,
  selectedTags,
  selectedCollection,
  selectedRating,
  onRemoveSearch,
  onRemoveTag,
  onRemoveCollection,
  onRemoveRating
}) => {
  const hasFilters = searchQuery || selectedTags.length > 0 || selectedCollection || selectedRating;

  if (!hasFilters) return null;

  return (
    <div className="flex items-center flex-wrap gap-2 p-3 bg-forest-dark/50 border-b border-forest-light">
      {/* Search query chip */}
      {searchQuery && (
        <div className="flex items-center gap-1 bg-forest-light px-3 py-1 rounded-full">
          <Hash className="w-3 h-3 text-silver/60" />
          <span className="font-quicksand text-sm text-silver">"{searchQuery}"</span>
          <button
            onClick={onRemoveSearch}
            className="ml-1 hover:bg-forest-main rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3 text-silver/60 hover:text-silver" />
          </button>
        </div>
      )}

      {/* Selected tags */}
      {selectedTags.map(tag => (
        <div key={tag} className="flex items-center gap-1 bg-forest-light px-3 py-1 rounded-full">
          <Tag className="w-3 h-3 text-accent-yellow" />
          <span className="font-quicksand text-sm text-silver">{tag}</span>
          <button
            onClick={() => onRemoveTag(tag)}
            className="ml-1 hover:bg-forest-main rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3 text-silver/60 hover:text-silver" />
          </button>
        </div>
      ))}

      {/* Selected collection */}
      {selectedCollection && (
        <div className="flex items-center gap-1 bg-forest-light px-3 py-1 rounded-full">
          <Folder className="w-3 h-3 text-accent-yellow" />
          <span className="font-quicksand text-sm text-silver">{selectedCollection}</span>
          <button
            onClick={onRemoveCollection}
            className="ml-1 hover:bg-forest-main rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3 text-silver/60 hover:text-silver" />
          </button>
        </div>
      )}

      {/* Selected rating */}
      {selectedRating && (
        <div className="flex items-center gap-1 bg-forest-light px-3 py-1 rounded-full">
          <Heart className="w-3 h-3 text-accent-coral" />
          <span className="font-quicksand text-sm text-silver capitalize">{selectedRating}</span>
          <button
            onClick={onRemoveRating}
            className="ml-1 hover:bg-forest-main rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3 text-silver/60 hover:text-silver" />
          </button>
        </div>
      )}

      {/* Clear all button */}
      {(selectedTags.length > 1 || 
        (searchQuery && (selectedTags.length > 0 || selectedCollection || selectedRating)) ||
        (!searchQuery && selectedTags.length > 0 && (selectedCollection || selectedRating))) && (
        <button
          onClick={() => {
            onRemoveSearch?.();
            selectedTags.forEach(tag => onRemoveTag(tag));
            onRemoveCollection?.();
            onRemoveRating?.();
          }}
          className="ml-auto font-quicksand text-xs text-silver/60 hover:text-silver transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
};

export default SearchFilterChips;