import React, { useState, useEffect } from 'react';
import { Filter, Star, Music, Layers } from 'lucide-react';
import { useSmartSectionFiltering } from '../../hooks/useCustomRatings';
import { supabase } from '../../lib/supabase';
import type { RatingCategory } from '../../types/customRatings';

interface SectionRatingFilterProps {
  onFilterApply: (trackIds: string[]) => void;
  onReset?: () => void;
}

const SectionRatingFilter: React.FC<SectionRatingFilterProps> = ({
  onFilterApply,
  onReset,
}) => {
  const [categories, setCategories] = useState<RatingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<'any_loved' | 'category_loved' | 'min_rating'>('any_loved');
  const [minRating, setMinRating] = useState(4);
  const [loading, setLoading] = useState(false);
  const { getTracksWithRatedSections, getTracksWithAnyLovedSection } = useSmartSectionFiltering();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('rating_categories')
      .select('*')
      .eq('is_global', true)
      .order('display_order');
    
    setCategories(data || []);
    if (data && data.length > 0) {
      setSelectedCategory(data[0].name);
    }
  };

  const handleApplyFilter = async () => {
    setLoading(true);
    let trackIds: string[] = [];

    try {
      switch (filterType) {
        case 'any_loved':
          // Get tracks with any section rated 5 stars
          trackIds = await getTracksWithAnyLovedSection();
          break;
          
        case 'category_loved':
          // Get tracks with specific category rated 5 stars
          if (selectedCategory) {
            const sections = await getTracksWithRatedSections(selectedCategory, undefined, 5);
            trackIds = [...new Set(sections.map(s => s.track_id))];
          }
          break;
          
        case 'min_rating':
          // Get tracks with minimum rating in category
          if (selectedCategory) {
            const sections = await getTracksWithRatedSections(selectedCategory, minRating);
            trackIds = [...new Set(sections.map(s => s.track_id))];
          }
          break;
      }

      onFilterApply(trackIds);
    } catch (error) {
      console.error('Error applying section filter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
      <div className="flex items-center justify-between mb-3">
        <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} />
          Section Ratings
        </label>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-silver/60 hover:text-silver"
          >
            Reset
          </button>
        )}
      </div>

      {/* Filter Type Selection */}
      <div className="space-y-2 mb-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="any_loved"
            checked={filterType === 'any_loved'}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-accent-yellow"
          />
          <span className="text-sm text-silver">Any loved section</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="category_loved"
            checked={filterType === 'category_loved'}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-accent-yellow"
          />
          <span className="text-sm text-silver">Loved in category</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="min_rating"
            checked={filterType === 'min_rating'}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-accent-yellow"
          />
          <span className="text-sm text-silver">Minimum rating</span>
        </label>
      </div>

      {/* Category Selection */}
      {(filterType === 'category_loved' || filterType === 'min_rating') && (
        <div className="mb-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Min Rating Slider */}
      {filterType === 'min_rating' && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-silver/60">Min Rating</span>
            <span className="text-xs text-accent-yellow">{minRating}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={minRating}
            onChange={(e) => setMinRating(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            {[1, 2, 3, 4, 5].map(val => (
              <Star
                key={val}
                size={12}
                className={val <= minRating ? 'text-yellow-500 fill-current' : 'text-gray-600'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={handleApplyFilter}
        disabled={loading}
        className="w-full px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-medium hover:bg-accent-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {loading ? 'Applying...' : 'Apply Section Filter'}
      </button>

      {/* Quick Presets */}
      <div className="mt-3 pt-3 border-t border-forest-light/30">
        <p className="text-xs text-silver/60 mb-2">Quick Filters:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              setFilterType('any_loved');
              setTimeout(handleApplyFilter, 100);
            }}
            className="px-2 py-1 bg-forest-dark rounded text-xs text-silver hover:bg-forest-light/50"
          >
            All Loved Sections
          </button>
          <button
            onClick={async () => {
              setFilterType('category_loved');
              setSelectedCategory('melody');
              setTimeout(handleApplyFilter, 100);
            }}
            className="px-2 py-1 bg-forest-dark rounded text-xs text-silver hover:bg-forest-light/50"
          >
            Loved Melodies
          </button>
          <button
            onClick={async () => {
              setFilterType('category_loved');
              setSelectedCategory('vibe');
              setTimeout(handleApplyFilter, 100);
            }}
            className="px-2 py-1 bg-forest-dark rounded text-xs text-silver hover:bg-forest-light/50"
          >
            Loved Vibes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionRatingFilter;