export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatRelativeDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Define track type for similarity matching
interface SimilarTrack {
  id: string;
  artist?: string;
  album?: string;
  genre?: string;
  key?: string;
  bpm?: number;
  [key: string]: unknown;
}

// Helper function to find similar tracks based on user metadata
export const findSimilarTracks = (targetTrack: SimilarTrack, allTracks: SimilarTrack[]) => {
  return allTracks
    .filter(track => track.id !== targetTrack.id)
    .map(track => {
      let similarity = 0;
      let factors = 0;

      // Key similarity (exact match)
      if (targetTrack.key && track.key) {
        factors++;
        if (targetTrack.key === track.key) {
          similarity += 3;
        }
      }

      // Tempo similarity (within 10 BPM)
      if (targetTrack.tempo && track.tempo) {
        factors++;
        const tempoDiff = Math.abs(targetTrack.tempo - track.tempo);
        if (tempoDiff <= 5) similarity += 3;
        else if (tempoDiff <= 10) similarity += 2;
        else if (tempoDiff <= 20) similarity += 1;
      }

      // Mood similarity
      if (targetTrack.mood && track.mood) {
        factors++;
        if (targetTrack.mood === track.mood) {
          similarity += 2;
        }
      }

      // Genre similarity
      if (targetTrack.genre && track.genre) {
        factors++;
        if (targetTrack.genre === track.genre) {
          similarity += 2;
        }
      }

      // Tag similarity
      if (targetTrack.tags && track.tags) {
        const commonTags = targetTrack.tags.filter((tag: string) => 
          track.tags.includes(tag)
        );
        if (commonTags.length > 0) {
          factors++;
          similarity += commonTags.length;
        }
      }

      return {
        track,
        similarity: factors > 0 ? similarity / factors : 0,
        factors
      };
    })
    .filter(result => result.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
};