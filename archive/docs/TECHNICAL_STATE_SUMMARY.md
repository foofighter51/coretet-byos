# Technical State Summary

## Current Working Code Structure

### Frontend Architecture
```
src/
├── components/
│   ├── Mobile/
│   │   ├── MobileNowPlaying.tsx (main mobile player)
│   │   ├── MobileRatingButtons.tsx (rating UI)
│   │   └── MobileRatingSection.tsx (rating logic wrapper)
│   ├── AudioPlayer.tsx
│   ├── TrackList.tsx
│   └── PlaylistSidebar.tsx
├── contexts/
│   ├── AudioContext.tsx (wake lock, media session)
│   └── AuthContext.tsx
├── hooks/
│   └── useTrackRating.ts (rating state management)
└── lib/
    └── supabase.ts (client config)
```

### Backend Structure
```
supabase/
├── functions/
│   ├── get-track-url/ (secure URL generation)
│   └── upload-track/ (file upload handler)
└── storage/
    └── audio-files/ (track storage)
```

### Key Technical Decisions Made

1. **Storage**: Supabase Storage (not S3)
   - Simplified architecture
   - No AWS dependencies
   - 50GB free tier sufficient

2. **Security**: Edge functions for signed URLs
   - Not using public buckets
   - User-scoped access control
   - 1-hour URL expiration

3. **Ratings**: Separate personal vs playlist context
   - Clean separation of concerns
   - Scalable for sharing

4. **Mobile**: PWA over native
   - Single codebase
   - Instant updates
   - Good enough performance

### Current Mobile Capabilities

✅ **What's Working**
- Offline playback (cached tracks)
- Background audio (wake lock)
- Lock screen controls (media session)
- Touch-optimized UI
- Installable PWA

⚠️ **Limitations**
- iOS audio restrictions (need user tap)
- No push notifications yet
- Limited offline functionality
- No background sync

### Performance Metrics
- Initial load: ~2-3 seconds
- Track switch: <500ms
- Rating update: ~1 second
- Build size: 574KB (needs optimization)

## Database Performance

### Indexes Created
- tracks(user_id)
- tracks(created_at)
- playlists(user_id)
- playlist_tracks(playlist_id)
- playlist_tracks(track_id)
- personal_track_ratings(user_id, track_id)
- playlist_track_ratings(user_id, playlist_track_id)

### RLS Performance
- Simple policies after rebuild
- No recursive checks
- Direct user_id comparisons
- Fast query execution

## Technical Debt & Considerations

### Immediate Concerns
1. **Bundle Size**: Main chunk is 574KB (should split)
2. **No Tests**: Need unit/integration tests
3. **Error Boundaries**: Missing in React components
4. **Type Safety**: Some any types lurking

### For Sharing Implementation
1. **Real-time**: No WebSocket setup yet
2. **Caching**: Basic, could be smarter
3. **Sync**: No conflict resolution
4. **Scale**: Not tested beyond single user

### Mobile-Specific Gaps
1. **Offline Queue**: Ratings don't sync when offline
2. **Large Playlists**: No virtualization
3. **Network**: No adaptive quality
4. **Storage**: No local track caching

## Current ENV/Config

### Required Environment Variables
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Supabase Configuration
- Row Level Security: Enabled
- Realtime: Not configured
- Storage: 1GB file limit
- Edge Functions: Deno runtime

### Build Configuration
- Vite for bundling
- TypeScript strict mode
- React 18
- Tailwind CSS

## Migration State

### Completed Migrations
- Removed S3 references
- Simplified RLS policies  
- Created rating system
- Fixed storage paths

### Dropped Features
- playlist_shares table
- collaborators system
- complex permissions
- AI analysis features

This clean slate is actually perfect for building the sharing system right - we're not fighting legacy complexity.