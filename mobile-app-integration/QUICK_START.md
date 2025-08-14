# CoreTet Mobile App - Quick Start Integration Guide

## 🚀 Quick Setup

### 1. Copy Essential Files
```bash
# From the CoreTet web app directory, copy this entire folder:
cp -r /Users/ericexley/Downloads/coretet_no_ai/mobile-app-integration /path/to/your/mobile-app/
```

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

For React Native:
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 3. Environment Setup
Create a `.env` file in your mobile app:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Initialize Supabase Client
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
// For React Native: import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage, // or AsyncStorage for React Native
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

## 📱 Core Features to Implement

### 1. Authentication (Magic Link)
```typescript
import { sendMagicLink, checkAuthStatus } from './auth/magic-link-implementation';

// Login
const handleLogin = async (email: string) => {
  const result = await sendMagicLink(email);
  if (result.success) {
    // Show success message
  }
};

// Check auth status
const { isAuthenticated, user } = await checkAuthStatus();
```

### 2. Track Management
```typescript
import { fetchTracks, createTrack, updateTrack } from './api-patterns/track-operations';

// Fetch user's tracks
const { tracks, error } = await fetchTracks(userId);

// Update track metadata
const { track, error } = await updateTrack(trackId, {
  artist: 'New Artist',
  tempo: '120',
  liked: true,
});
```

### 3. Playlist Operations
```typescript
import { fetchPlaylists, createPlaylist, addTrackToPlaylist } from './api-patterns/playlist-operations';

// Create playlist
const { playlist } = await createPlaylist('My Playlist', 'Description', userId);

// Add track to playlist
const { success } = await addTrackToPlaylist(playlistId, trackId, userId);
```

### 4. Audio Playback
```typescript
import { getAudioUrl } from './api-patterns/track-operations';

// Get audio URL for streaming
const audioUrl = getAudioUrl(track.storage_path);

// Use with your audio player
// For React Native: Use react-native-track-player or expo-av
// For web: Use HTML5 Audio API
```

## 🎨 UI Implementation

### Colors
```typescript
import { colors } from './color-scheme';

// Use the CoreTet color palette
const styles = {
  container: {
    backgroundColor: colors.forest.main,
  },
  primaryButton: {
    backgroundColor: colors.accent.yellow,
  },
};
```

### Key UI Components to Build

1. **Track List**
   - Virtual scrolling for performance
   - Swipe actions (mobile)
   - Multi-select for bulk operations

2. **Player Controls**
   - Mini player (bottom bar)
   - Full screen player
   - Background playback (mobile)

3. **Filter/Search**
   - Quick search bar
   - Advanced filters modal
   - Saved filter presets

4. **Upload Flow**
   - File picker
   - Metadata entry
   - Progress indicator

## 🔄 Real-time Updates

```typescript
import { subscribeToTrackChanges } from './api-patterns/track-operations';

// Subscribe to track updates
const subscription = subscribeToTrackChanges(userId, (payload) => {
  console.log('Track changed:', payload);
  // Update your local state
});

// Don't forget to unsubscribe
subscription.unsubscribe();
```

## 📝 Data Models

All TypeScript interfaces are in `types/index.ts`:
- `Track` - Audio file with metadata
- `Playlist` - User-created collections
- `User` - User profile
- `FilterState` - Advanced filtering

## 🔐 Security Notes

1. **Never expose service keys** in mobile apps
2. **Use Row Level Security** - Already configured in Supabase
3. **Validate file uploads** - Check size and type
4. **Handle auth tokens securely** - Use secure storage on mobile

## 🚧 Mobile-Specific Considerations

### iOS
- Configure deep links for magic link callback
- Handle background audio in Info.plist
- Request microphone permissions for voice memos

### Android
- Configure intent filters for deep links
- Add foreground service for playback
- Handle storage permissions

### Performance
- Implement lazy loading for track lists
- Cache audio files for offline playback
- Use thumbnails for waveforms
- Batch API requests

## 📞 Need Help?

1. Check the full documentation in each subfolder
2. Review the web app code for implementation examples
3. Test API calls using the provided functions
4. Use TypeScript for better development experience

## 🎯 MVP Features

Start with these core features:
1. ✅ Magic link authentication
2. ✅ Display track list
3. ✅ Basic audio playback
4. ✅ Search tracks
5. ✅ Create/manage playlists

Then add:
- Upload new tracks
- Advanced filtering
- Offline support
- Push notifications