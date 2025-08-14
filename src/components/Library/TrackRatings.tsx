import React from 'react';
import { Heart, ThumbsUp, Headphones } from 'lucide-react';

interface Rating {
  listened: number;
  liked: number;
  loved: number;
  details?: Array<{
    name: string;
    rating: string;
  }>;
}

interface TrackRatingsProps {
  trackId: string;
  playlistId?: string;
  ratings?: Rating;
  compact?: boolean;
  showDetails?: boolean;
}

const TrackRatings: React.FC<TrackRatingsProps> = ({ 
  trackId, 
  playlistId, 
  ratings,
  compact = true,
  showDetails = false 
}) => {
  if (!ratings || (ratings.listened === 0 && ratings.liked === 0 && ratings.loved === 0)) {
    return null;
  }

  const ratingItems = [
    { type: 'listened' as const, icon: Headphones, color: 'text-silver' },
    { type: 'liked' as const, icon: ThumbsUp, color: 'text-accent-green' },
    { type: 'loved' as const, icon: Heart, color: 'text-accent-coral' },
  ];

  return (
    <div className="flex items-center space-x-3">
      {ratingItems.map(({ type, icon: Icon, color }) => {
        const count = ratings[type];
        if (count === 0 && compact) return null;
        
        return (
          <div 
            key={type}
            className={`flex items-center space-x-1 ${compact ? '' : 'px-2 py-1 bg-forest-light rounded-lg'}`}
            title={showDetails && ratings.details ? 
              ratings.details
                .filter(d => d.rating === type)
                .map(d => d.name)
                .join(', ') 
              : undefined
            }
          >
            <Icon className={`w-3.5 h-3.5 ${count > 0 ? color : 'text-silver/30'}`} />
            {(!compact || count > 0) && (
              <span className={`font-quicksand text-xs font-medium ${count > 0 ? color : 'text-silver/30'}`}>
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TrackRatings;