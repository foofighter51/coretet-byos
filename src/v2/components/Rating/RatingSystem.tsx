import React, { useState } from 'react';

export type RatingType = 'none' | 'listen' | 'like' | 'love';

interface RatingSystemProps {
  rating?: RatingType;
  onRatingChange?: (rating: RatingType) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function RatingSystem({ 
  rating = 'none', 
  onRatingChange, 
  size = 'md',
  readonly = false 
}: RatingSystemProps) {
  const [hoverRating, setHoverRating] = useState<RatingType>('none');

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];

  const handleRatingClick = (newRating: RatingType) => {
    if (readonly) return;
    
    // Toggle off if clicking the same rating
    const finalRating = rating === newRating ? 'none' : newRating;
    onRatingChange?.(finalRating);
  };

  const getIconState = (iconType: RatingType) => {
    if (readonly) {
      return rating === iconType ? 'active' : 'inactive';
    }

    const currentRating = hoverRating !== 'none' ? hoverRating : rating;
    
    if (currentRating === iconType) return 'active';
    if (currentRating === 'none') return 'inactive';
    
    // Progressive rating logic
    const ratingOrder: RatingType[] = ['listen', 'like', 'love'];
    const currentIndex = ratingOrder.indexOf(currentRating);
    const iconIndex = ratingOrder.indexOf(iconType);
    
    return iconIndex <= currentIndex ? 'active' : 'inactive';
  };

  const getIconClass = (iconType: RatingType) => {
    const state = getIconState(iconType);
    const isActive = state === 'active';
    
    if (readonly) {
      return isActive ? 'text-accent-yellow' : 'text-silver/20';
    }

    return `transition-colors cursor-pointer ${
      isActive 
        ? 'text-accent-yellow' 
        : 'text-silver/40 hover:text-silver/60'
    }`;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Listen */}
      <button
        onClick={() => handleRatingClick('listen')}
        onMouseEnter={() => !readonly && setHoverRating('listen')}
        onMouseLeave={() => !readonly && setHoverRating('none')}
        className={getIconClass('listen')}
        title="Listen"
        disabled={readonly}
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </button>

      {/* Like */}
      <button
        onClick={() => handleRatingClick('like')}
        onMouseEnter={() => !readonly && setHoverRating('like')}
        onMouseLeave={() => !readonly && setHoverRating('none')}
        className={getIconClass('like')}
        title="Like"
        disabled={readonly}
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>

      {/* Love */}
      <button
        onClick={() => handleRatingClick('love')}
        onMouseEnter={() => !readonly && setHoverRating('love')}
        onMouseLeave={() => !readonly && setHoverRating('none')}
        className={getIconClass('love')}
        title="Love"
        disabled={readonly}
      >
        <svg 
          className={iconSize} 
          fill={getIconState('love') === 'active' ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  );
}

export function RatingFilter({ 
  selectedRating, 
  onRatingChange 
}: { 
  selectedRating?: RatingType; 
  onRatingChange: (rating: RatingType | undefined) => void; 
}) {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-silver/70 text-xs font-quicksand">Min Rating:</span>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onRatingChange(selectedRating === 'listen' ? undefined : 'listen')}
          className={`p-1 transition-colors ${
            selectedRating === 'listen' 
              ? 'text-accent-yellow' 
              : 'text-silver/40 hover:text-silver/60'
          }`}
          title="Listen or higher"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <button
          onClick={() => onRatingChange(selectedRating === 'like' ? undefined : 'like')}
          className={`p-1 transition-colors ${
            selectedRating === 'like' 
              ? 'text-accent-yellow' 
              : 'text-silver/40 hover:text-silver/60'
          }`}
          title="Like or higher"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        <button
          onClick={() => onRatingChange(selectedRating === 'love' ? undefined : 'love')}
          className={`p-1 transition-colors ${
            selectedRating === 'love' 
              ? 'text-accent-yellow' 
              : 'text-silver/40 hover:text-silver/60'
          }`}
          title="Love only"
        >
          <svg 
            className="w-4 h-4" 
            fill={selectedRating === 'love' ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}