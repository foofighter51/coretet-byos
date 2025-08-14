import { Track } from '../types';
import { SortOption, SortDirection } from '../hooks/useViewPreferences';

interface SortConfig {
  sortBy: SortOption;
  sortDirection: SortDirection;
  manualPositions?: Record<string, number>;
  collectionOrder?: string[]; // For collection-specific ordering
}

export const sortTracks = (tracks: Track[], config: SortConfig): Track[] => {
  // Ensure tracks is an array
  if (!tracks || !Array.isArray(tracks)) {
    return [];
  }
  
  const { sortBy, sortDirection, manualPositions = {}, collectionOrder } = config;
  
  // Sort tracks with configuration
  
  // Create a copy to avoid mutating the original array
  const sorted = [...tracks];

  // If we have manual positions and are in manual sort mode (sortBy === 'manual')
  // Sort entirely by manual positions, or by added date if no positions exist yet
  if (sortBy === 'manual') {
    if (Object.keys(manualPositions).length > 0) {
      sorted.sort((a, b) => {
        const aPos = manualPositions[a.id] ?? Number.MAX_SAFE_INTEGER;
        const bPos = manualPositions[b.id] ?? Number.MAX_SAFE_INTEGER;
        return aPos - bPos;
      });
    } else {
      // Default to added order for initial manual mode
      sorted.sort((a, b) => {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      });
    }
    return sorted;
  }

  // If we have a collection order and sortBy is 'added', use that order
  if (sortBy === 'added' && collectionOrder && collectionOrder.length > 0) {
    const orderMap = new Map(collectionOrder.map((id, idx) => [id, idx]));
    sorted.sort((a, b) => {
      const aPos = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bPos = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aPos - bPos;
    });
    return sorted;
  }

  // Standard sorting function
  const compareFn = (a: Track, b: Track): number => {
    let result = 0;

    switch (sortBy) {
      case 'added':
        // Sort by upload date (newest first by default)
        result = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;
      
      case 'title':
        result = (a.name || '').localeCompare(b.name || '');
        console.log(`Comparing titles: "${a.name}" vs "${b.name}" = ${result}`);
        break;
      
      case 'type':
        result = a.category.localeCompare(b.category);
        break;
      
      case 'artist':
        result = (a.artist || '').localeCompare(b.artist || '');
        break;
      
      case 'album':
        result = (a.collection || '').localeCompare(b.collection || '');
        break;
      
      case 'duration':
        result = (a.duration || 0) - (b.duration || 0);
        break;
      
      case 'date':
        result = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;
      
      case 'manual':
        // Manual sorting is handled earlier, this shouldn't be reached
        // But include for completeness
        return 0;
    }

    // Apply sort direction
    if (sortDirection === 'desc') {
      result = -result;
    }

    return result;
  };

  // Sort tracks
  sorted.sort(compareFn);

  // Apply manual position overrides
  if (Object.keys(manualPositions).length > 0) {
    // Separate manually positioned tracks from auto-sorted tracks
    const manual: Track[] = [];
    const auto: Track[] = [];

    sorted.forEach(track => {
      if (track.id in manualPositions) {
        manual.push(track);
      } else {
        auto.push(track);
      }
    });

    // Sort manual tracks by their position
    manual.sort((a, b) => (manualPositions[a.id] || 0) - (manualPositions[b.id] || 0));

    // Merge manual and auto tracks
    const result: Track[] = [];
    let autoIndex = 0;

    // Build the final array by interleaving manual and auto tracks
    for (let i = 0; i < sorted.length; i++) {
      // Check if there's a manual track for this position
      const manualTrack = manual.find(track => manualPositions[track.id] === i);
      
      if (manualTrack) {
        result.push(manualTrack);
      } else if (autoIndex < auto.length) {
        result.push(auto[autoIndex]);
        autoIndex++;
      }
    }

    return result;
  }

  return sorted;
};

// Helper to calculate new position when dragging
export const calculateDragPosition = (
  draggedTrackId: string,
  targetIndex: number,
  tracks: Track[],
  existingPositions: Record<string, number>
): Record<string, number> => {
  const positions = { ...existingPositions };
  
  // Remove the dragged track's current position
  delete positions[draggedTrackId];
  
  // Shift positions for tracks that need to move
  const updatedPositions: Record<string, number> = {};
  
  tracks.forEach((track, _index) => {
    if (track.id === draggedTrackId) {
      updatedPositions[track.id] = targetIndex;
    } else if (track.id in positions) {
      // This track has a manual position
      const currentPos = positions[track.id];
      if (currentPos >= targetIndex) {
        // Shift down
        updatedPositions[track.id] = currentPos + 1;
      } else {
        updatedPositions[track.id] = currentPos;
      }
    }
  });

  return updatedPositions;
};