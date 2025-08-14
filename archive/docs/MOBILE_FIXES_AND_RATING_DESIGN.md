# Mobile Fixes and Rating System Design

## 1. Mobile Loading/Refresh Issues

### Likely Causes:
- Multiple context providers re-rendering
- Duplicate data fetching
- State management issues

### Fix: Optimize MobileNowPlaying
```typescript
// Add proper loading states and error boundaries
const MobileNowPlaying = () => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Prevent duplicate fetches
    if (!isInitialLoad) return;
    
    loadPlaylistData()
      .finally(() => setIsInitialLoad(false));
  }, [playlistId]); // Only re-fetch when playlist changes
};
```

## 2. Mobile Playback Errors

### Issues to Check:
- Mobile browsers have stricter autoplay policies
- iOS requires user interaction before playing audio
- Background playback limitations

### Fix: Mobile-Optimized Audio Context
```typescript
// Handle mobile-specific audio requirements
const handleMobilePlay = async (trackId: string) => {
  try {
    // iOS requires user gesture
    if (isIOS && !hasUserInteracted) {
      showPlayButton();
      return;
    }
    
    await playTrack(trackId);
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      // Show "Tap to play" message
    }
  }
};
```

## 3. Rating System Architecture

### Design Principle: Separation of Concerns
- **Personal ratings**: Your rating for a track in YOUR library
- **Playlist ratings**: Your rating for a track in a SHARED playlist
- **Aggregate ratings**: Average of all collaborators' ratings

### Database Schema
```sql
-- Personal ratings (already exists as tracks.rating)
ALTER TABLE tracks ADD COLUMN personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5);

-- Playlist-specific ratings
CREATE TABLE playlist_track_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_track_id UUID REFERENCES playlist_tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_track_id, user_id)
);

-- View for aggregate ratings
CREATE VIEW playlist_track_aggregate_ratings AS
SELECT 
  playlist_track_id,
  COUNT(rating) as rating_count,
  AVG(rating)::DECIMAL(2,1) as average_rating,
  ARRAY_AGG(
    jsonb_build_object(
      'user_id', user_id,
      'rating', rating
    ) ORDER BY created_at
  ) as individual_ratings
FROM playlist_track_ratings
GROUP BY playlist_track_id;
```

### UI/UX Design
```
Personal Library View:
┌─────────────────────────┐
│ Track Name              │
│ ⭐⭐⭐⭐☆ (Your rating)   │
└─────────────────────────┘

Shared Playlist View:
┌─────────────────────────┐
│ Track Name              │
│ ⭐⭐⭐⭐☆ (Your rating)   │
│ ⭐⭐⭐½☆ (Avg: 3.5)      │
│ 3 collaborators rated   │
└─────────────────────────┘
```

### React Implementation
```typescript
interface TrackRating {
  personalRating?: number;      // Your library rating
  playlistRating?: number;      // Your rating in this playlist
  averageRating?: number;       // All collaborators' average
  ratingCount?: number;         // How many rated
}

const TrackRatingDisplay: React.FC<{
  track: Track;
  playlistId?: string;
  isSharedPlaylist: boolean;
}> = ({ track, playlistId, isSharedPlaylist }) => {
  if (!isSharedPlaylist) {
    // Show only personal rating
    return <StarRating value={track.personalRating} onChange={updatePersonalRating} />;
  }
  
  // Show both your playlist rating and aggregate
  return (
    <div>
      <StarRating 
        value={track.playlistRating} 
        onChange={(rating) => updatePlaylistRating(track.id, playlistId, rating)}
        label="Your rating"
      />
      {track.ratingCount > 1 && (
        <div className="text-sm text-gray-500">
          <StarRating value={track.averageRating} readonly />
          <span>{track.ratingCount} ratings</span>
        </div>
      )}
    </div>
  );
};
```

## 4. Implementation Plan

### Phase 1: Fix Mobile Issues
1. Add error boundaries to mobile components
2. Implement proper loading states
3. Fix audio playback for mobile browsers
4. Add offline detection and handling

### Phase 2: Basic Rating System
1. Create playlist_track_ratings table
2. Add rating UI to mobile playlist view
3. Show your rating vs average rating

### Phase 3: Enhanced Features
1. Show who rated what (on tap/hover)
2. Rating history/trends
3. Filter by rating
4. Export playlist with ratings

## 5. Mobile-Specific Optimizations

### Service Worker for Offline
```javascript
// Cache played tracks for offline playback
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/audio-files/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          return caches.open('audio-cache-v1').then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

### Prevent Unnecessary Re-renders
```typescript
// Use React.memo for expensive components
const MobileTrackList = React.memo(({ tracks }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Only re-render if tracks actually changed
  return prevProps.tracks.length === nextProps.tracks.length &&
         prevProps.tracks.every((track, index) => 
           track.id === nextProps.tracks[index].id
         );
});
```