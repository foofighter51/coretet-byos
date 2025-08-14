import React from 'react';
import { Music, Clock, User } from 'lucide-react';

interface MobilePlaylistCardProps {
  name: string;
  trackCount: number;
  duration?: string;
  lastUpdated?: string;
  owner?: string;
  isShared?: boolean;
  onClick?: () => void;
  onOptionsClick?: (e: React.MouseEvent) => void;
}

const MobilePlaylistCard: React.FC<MobilePlaylistCardProps> = ({
  name,
  trackCount,
  duration,
  lastUpdated,
  owner,
  isShared = false,
  onClick,
  onOptionsClick
}) => {
  // Generate gradient based on playlist name for consistency
  const generateGradient = (name: string) => {
    const gradients = [
      'from-purple-600 to-blue-600',
      'from-green-600 to-teal-600',
      'from-orange-600 to-red-600',
      'from-pink-600 to-rose-600',
      'from-indigo-600 to-purple-600',
      'from-yellow-600 to-orange-600',
      'from-cyan-600 to-blue-600',
      'from-emerald-600 to-green-600'
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };

  return (
    <div
      onClick={onClick}
      className="bg-forest-main rounded-lg p-4 border border-forest-light hover:bg-forest-light transition-all duration-200 cursor-pointer active:scale-[0.98] min-h-[88px]"
    >
      <div className="flex gap-4">
        {/* Gradient Placeholder */}
        <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${generateGradient(name)} flex-shrink-0 flex items-center justify-center`}>
          <Music className="w-8 h-8 text-white opacity-80" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-silver font-semibold truncate">{name}</h3>
          
          <div className="flex items-center gap-3 mt-1">
            <span className="text-silver opacity-60 text-sm">
              {trackCount} tracks
            </span>
            
            {duration && (
              <>
                <span className="text-silver opacity-40">•</span>
                <span className="text-silver opacity-60 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {duration}
                </span>
              </>
            )}
          </div>

          {/* Additional metadata */}
          <div className="flex items-center gap-3 mt-2">
            {isShared && owner && (
              <span className="text-silver opacity-40 text-xs flex items-center gap-1">
                <User className="w-3 h-3" />
                {owner}
              </span>
            )}
            
            {lastUpdated && (
              <span className="text-silver opacity-40 text-xs">
                Updated {lastUpdated}
              </span>
            )}
          </div>
        </div>

        {/* Options button if provided */}
        {onOptionsClick && (
          <button
            onClick={onOptionsClick}
            className="p-3 -m-1 text-silver opacity-60 hover:opacity-100 transition-all duration-200 active:scale-95 min-w-[44px] min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobilePlaylistCard;