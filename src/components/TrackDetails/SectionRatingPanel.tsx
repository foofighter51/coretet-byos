import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, Plus, X, Edit2 } from 'lucide-react';
import { useRatingCategories, useSectionRatings } from '../../hooks/useCustomRatings';
import type { AudioSection, RatingCategoryWithScale } from '../../types';

interface SectionRatingPanelProps {
  section: AudioSection;
  trackId: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const SectionRatingPanel: React.FC<SectionRatingPanelProps> = ({
  section,
  trackId,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { categories, loading: categoriesLoading } = useRatingCategories(trackId);
  const { ratings, aggregates, updateRating, deleteRating } = useSectionRatings(section.id);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleRatingClick = async (categoryId: string, value: number) => {
    // If clicking the same rating, remove it
    if (ratings[categoryId]?.rating_value === value) {
      await deleteRating(categoryId);
    } else {
      await updateRating({
        section_id: section.id,
        category_id: categoryId,
        rating_value: value,
      });
    }
  };

  const handleNotesSubmit = async (categoryId: string) => {
    await updateRating({
      section_id: section.id,
      category_id: categoryId,
      rating_value: ratings[categoryId]?.rating_value,
      notes,
    });
    setShowNotes(null);
    setNotes('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRatingStars = (category: RatingCategoryWithScale) => {
    const currentRating = ratings[category.id]?.rating_value || 0;
    const avgRating = aggregates[category.id]?.avg_rating || 0;
    const totalRatings = aggregates[category.id]?.total_ratings || 0;
    const maxValue = category.scale?.max_value || 5;

    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: maxValue }, (_, i) => (
            <button
              key={i}
              onClick={() => handleRatingClick(category.id, i + 1)}
              className={`transition-all hover:scale-110 ${
                i < currentRating
                  ? 'text-yellow-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title={`Rate ${i + 1} out of ${maxValue}`}
            >
              <Star
                size={20}
                className={i < currentRating ? 'fill-current' : ''}
              />
            </button>
          ))}
        </div>
        
        {totalRatings > 0 && (
          <div className="text-xs text-gray-500 ml-2">
            avg: {avgRating.toFixed(1)} ({totalRatings})
          </div>
        )}

        {ratings[category.id] && (
          <button
            onClick={() => {
              setShowNotes(category.id);
              setNotes(ratings[category.id]?.notes || '');
            }}
            className="ml-2 text-gray-400 hover:text-gray-300"
            title="Add notes"
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>
    );
  };

  const renderDescriptiveRating = (category: RatingCategoryWithScale) => {
    const labels = category.scale?.scale_labels || {};
    const currentValue = ratings[category.id]?.rating_value;

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(labels).map(([value, label]) => (
          <button
            key={value}
            onClick={() => handleRatingClick(category.id, parseInt(value))}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              currentValue === parseInt(value)
                ? 'bg-accent-yellow text-primary-dark'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  };

  if (categoriesLoading) {
    return <div className="p-4 text-gray-500">Loading rating categories...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: section.color }}
          />
          <h3 className="font-semibold text-white">{section.name}</h3>
          <span className="text-sm text-gray-400">
            {formatTime(section.start_time)} - {formatTime(section.end_time)}
          </span>
        </div>
        
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      {/* Rating Categories */}
      {isExpanded && (
        <div className="space-y-3 pt-2">
          {categories.map(category => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center gap-2">
                {category.icon && <span>{category.icon}</span>}
                <span className="text-sm font-medium text-gray-300">
                  {category.name}
                </span>
                {category.description && (
                  <span className="text-xs text-gray-500">
                    ({category.description})
                  </span>
                )}
              </div>

              {category.scale?.scale_type === 'numeric' ? (
                renderRatingStars(category)
              ) : category.scale?.scale_type === 'descriptive' ? (
                renderDescriptiveRating(category)
              ) : null}

              {/* Notes input */}
              {showNotes === category.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="flex-1 px-3 py-1 bg-gray-700 rounded text-sm text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleNotesSubmit(category.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleNotesSubmit(category.id)}
                    className="px-3 py-1 bg-accent-yellow text-primary-dark rounded text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowNotes(null);
                      setNotes('');
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Display existing notes */}
              {ratings[category.id]?.notes && showNotes !== category.id && (
                <div className="text-xs text-gray-400 italic pl-6">
                  Note: {ratings[category.id].notes}
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No rating categories defined</p>
              <button className="mt-2 text-accent-yellow hover:underline text-sm">
                Add rating categories
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionRatingPanel;