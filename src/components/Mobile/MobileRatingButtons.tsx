import React from 'react';
import { Headphones, Heart, Star } from 'lucide-react';
import { RatingType } from '../../hooks/useTrackRating';

interface MobileRatingButtonsProps {
  currentRating?: RatingType;
  onRatingChange: (rating: RatingType) => void;
  disabled?: boolean;
  showCounts?: boolean;
  counts?: {
    listened: number;
    liked: number;
    loved: number;
  };
}

const MobileRatingButtons: React.FC<MobileRatingButtonsProps> = ({
  currentRating,
  onRatingChange,
  disabled = false,
  showCounts = false,
  counts
}) => {
  const ratingOptions = [
    { 
      type: 'listened' as RatingType, 
      icon: Headphones, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Listened'
    },
    { 
      type: 'liked' as RatingType, 
      icon: Star, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Liked'
    },
    { 
      type: 'loved' as RatingType, 
      icon: Heart, 
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      label: 'Loved'
    }
  ];

  return (
    <div className="flex gap-2">
      {ratingOptions.map(({ type, icon: Icon, color, bgColor, label }) => {
        const isActive = currentRating === type;
        const count = counts?.[type] || 0;
        
        return (
          <button
            key={type}
            onClick={() => onRatingChange(type)}
            disabled={disabled}
            className={`
              flex items-center justify-center p-2 rounded-lg
              transition-all duration-200 relative
              ${isActive 
                ? `${bgColor} ${color}` 
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
            `}
          >
            <Icon 
              className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} 
            />
            
            {showCounts && count > 0 && (
              <span className={`
                absolute -top-1 -right-1 text-xs font-bold
                min-w-[20px] h-5 flex items-center justify-center px-1 rounded-full
                ${isActive 
                  ? color === 'text-blue-500' ? 'bg-blue-500 text-white' 
                    : color === 'text-yellow-500' ? 'bg-yellow-500 text-black'
                    : 'bg-pink-500 text-white'
                  : 'bg-gray-600 text-white'
                }
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MobileRatingButtons;