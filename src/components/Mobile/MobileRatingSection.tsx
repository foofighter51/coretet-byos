import React from 'react';
import MobileRatingButtons from './MobileRatingButtons';
import { useTrackRating } from '../../hooks/useTrackRating';

interface MobileRatingSectionProps {
  trackId: string;
  playlistId?: string;
}

const MobileRatingSection: React.FC<MobileRatingSectionProps> = ({ trackId, playlistId }) => {
  const { 
    personalRating, 
    playlistRating, 
    playlistRatingSummary,
    updatePersonalRating,
    updatePlaylistRating,
    loading 
  } = useTrackRating(trackId, playlistId);

  const handleRatingChange = async (rating: 'listened' | 'liked' | 'loved') => {
    // Toggle rating if already selected, otherwise set new rating
    const newRating = (playlistId ? playlistRating : personalRating) === rating ? null : rating;
    
    if (playlistId) {
      await updatePlaylistRating(newRating);
    } else {
      await updatePersonalRating(newRating);
    }
  };

  return (
    <MobileRatingButtons
      currentRating={playlistId ? playlistRating : personalRating}
      onRatingChange={handleRatingChange}
      disabled={loading}
      showCounts={!!playlistId}
      counts={playlistRatingSummary}
    />
  );
};

export default MobileRatingSection;