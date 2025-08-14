import React, { useState } from 'react';
import { Star, ChevronRight, Music, Layers } from 'lucide-react';
import { useTrackSectionRatings, useRatingCategories } from '../../hooks/useCustomRatings';
import type { Track, AudioSectionWithRatings, RatingCategoryWithScale } from '../../types';

interface MobileSectionRatingsProps {
  track: Track;
  currentTime?: number;
  onSectionSelect?: (section: AudioSectionWithRatings) => void;
}

const MobileSectionRatings: React.FC<MobileSectionRatingsProps> = ({
  track,
  currentTime = 0,
  onSectionSelect,
}) => {
  const { sections, loading } = useTrackSectionRatings(track.id);
  const { categories } = useRatingCategories(track.id);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Find current section based on playback time
  const currentSection = sections.find(
    s => currentTime >= s.start_time && currentTime <= s.end_time
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCompactRating = (section: AudioSectionWithRatings) => {
    const ratings = Object.values(section.userRatings || {});
    if (ratings.length === 0) return null;

    const avgRating = ratings.reduce((sum, r) => sum + (r.rating_value || 0), 0) / ratings.length;
    const hasLoved = ratings.some(r => r.rating_value === 5);

    return (
      <div className="flex items-center gap-1">
        {hasLoved && <Star size={14} className="text-yellow-500 fill-current" />}
        <span className="text-xs text-gray-400">{avgRating.toFixed(1)}</span>
      </div>
    );
  };

  const renderQuickRating = (section: AudioSectionWithRatings, category: RatingCategoryWithScale) => {
    const rating = section.userRatings?.[category.id];
    const maxValue = category.scale?.max_value || 5;

    return (
      <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {category.icon && <span className="text-sm">{category.icon}</span>}
            <span className="text-sm font-medium text-white">{category.name}</span>
          </div>
        </div>
        
        <div className="flex gap-1">
          {Array.from({ length: maxValue }, (_, i) => (
            <button
              key={i}
              className={`transition-all ${
                rating && i < rating.rating_value!
                  ? 'text-yellow-500'
                  : 'text-gray-600'
              }`}
              onClick={() => {
                // Handle rating update
              }}
            >
              <Star
                size={16}
                className={rating && i < rating.rating_value! ? 'fill-current' : ''}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading sections...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-t-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-accent-yellow" />
          <h3 className="font-semibold text-white">Section Ratings</h3>
        </div>
        
        {currentSection && (
          <div className="text-xs text-gray-400">
            Current: {currentSection.name}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto gap-2 p-3 border-b border-gray-800">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
            !selectedCategory
              ? 'bg-accent-yellow text-primary-dark'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-accent-yellow text-primary-dark'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Sections List */}
      <div className="max-h-96 overflow-y-auto">
        {sections.map(section => {
          const isExpanded = expandedSection === section.id;
          const isCurrent = currentSection?.id === section.id;

          return (
            <div
              key={section.id}
              className={`border-b border-gray-800 ${
                isCurrent ? 'bg-gray-800' : ''
              }`}
            >
              {/* Section Header */}
              <button
                onClick={() => {
                  setExpandedSection(isExpanded ? null : section.id);
                  onSectionSelect?.(section);
                }}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <div className="text-left">
                    <div className="font-medium text-white">
                      {section.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(section.start_time)} - {formatTime(section.end_time)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderCompactRating(section)}
                  <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Ratings */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {selectedCategory ? (
                    // Show single category
                    categories
                      .filter(cat => cat.id === selectedCategory)
                      .map(cat => renderQuickRating(section, cat))
                  ) : (
                    // Show all categories
                    categories.map(cat => renderQuickRating(section, cat))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-2">
          <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400">
            <Music size={16} className="mx-auto mb-1" />
            Jump to Section
          </button>
          <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400">
            <Star size={16} className="mx-auto mb-1" />
            Loved Only
          </button>
          <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400">
            <Layers size={16} className="mx-auto mb-1" />
            Compare
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileSectionRatings;