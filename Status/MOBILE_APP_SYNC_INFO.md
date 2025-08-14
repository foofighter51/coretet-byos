# CoreTet Mobile App Sync Information
*Generated: August 12, 2025*

## 🔄 Current Web App TypeScript Interfaces

### Core Track Interface
```typescript
export interface Track {
  id: string;
  name: string;
  file: File | null;
  url: string;
  duration: number;
  category: TrackCategory;
  uploadedAt: Date;
  tags: string[];
  // User-entered metadata
  artist?: string;
  collection?: string;
  key?: string;
  tempo?: number; // BPM for arrangements
  timeSignature?: string;
  mood?: string;
  genre?: string;
  notes?: string;
  tuning?: string; // NEW: Instrument tuning (e.g., Drop D, DADGAD)
  lyrics?: string; // NEW: Song lyrics
  // Rating fields
  listened?: boolean;
  liked?: boolean;
  loved?: boolean;
  // Variations
  primary_track_id?: string | null;
  variation_count?: number;
  // Soft delete
  deleted_at?: string | null;
  // Timestamps
  updated_at?: string;
}

export type TrackCategory = 'songs' | 'demos' | 'ideas' | 'voice-memos' | 'final-versions' | 'live-performances';
```

### Playlist Interface
```typescript
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Interface (NEW)
```typescript
export interface Task {
  id: string;
  track_id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  user_order?: number;
  created_at: string;
  updated_at: string;
}
```

### User Profile
```typescript
export interface UserProfile {
  id: string;
  email: string;
  storage_used: number;
  storage_limit: number;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
}
```

## 🆕 New Features Added (August 12, 2025)

### 1. Custom Rating System
- **Detailed Ratings**: Like/love system for 6 categories:
  - vibe
  - lyrics  
  - melody
  - progression
  - rhythm
  - energy

### 2. Comments System
```typescript
interface TrackComment {
  id: string;
  track_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}
```

### 3. New Track Fields
- `tuning`: Text field for instrument tuning information
- `lyrics`: Text field for song lyrics (owner-only editing)

## 📊 Database Schema Updates

### New Tables Created
```sql
-- Comments table
CREATE TABLE track_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Detailed ratings
CREATE TABLE track_detailed_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES rating_categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_value integer,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Rating categories
CREATE TABLE rating_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  created_by uuid REFERENCES auth.users(id),
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  is_global boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tasks table (fully functional)
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  due_date date,
  priority text CHECK (priority IN ('low', 'medium', 'high')),
  category text,
  user_order integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

### Updated Tracks Table
```sql
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS tuning TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS lyrics TEXT;
```

## 🔑 Key Constants & Enums

### Track Categories
```typescript
const TRACK_CATEGORIES = [
  'songs',
  'demos', 
  'ideas',
  'voice-memos',
  'final-versions',
  'live-performances'
];
```

### Musical Keys (Reorganized)
Now grouped as major/minor pairs:
- C Major, C Minor
- C# Major, C# Minor  
- D Major, D Minor
- (etc...)

### Genres Available
26 genres including: Rock, Pop, Jazz, Classical, Electronic, Hip Hop, R&B, Country, Folk, Blues, Metal, Punk, Indie, Alternative, Reggae, Soul, Funk, Disco, House, Techno, Ambient, Experimental, World, Latin, Gospel, Soundtrack

## 🔌 Supabase Integration Details

### Authentication
- Email/password authentication
- Magic link support
- Password reset flow

### Storage Buckets
- `audio-files`: Main audio file storage
- Public URL generation with signed URLs

### Real-time Subscriptions
- Comments updates
- Track changes
- Playlist modifications

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only see/edit their own data
- Shared playlists have special permissions
- Tasks are user-isolated

## 🚀 How to Sync Mobile App

### 1. Update TypeScript Interfaces
Copy the interfaces above to your mobile app's type definitions.

### 2. Database Connection
Use the same Supabase project credentials:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 3. Key API Endpoints (via Supabase)
```typescript
// Tracks
supabase.from('tracks').select('*')
supabase.from('tracks').insert({...})
supabase.from('tracks').update({...})

// Playlists
supabase.from('playlists').select('*')
supabase.from('playlist_tracks').select('*')

// Tasks
supabase.from('tasks').select('*').eq('track_id', trackId)

// Comments
supabase.from('track_comments').select('*').eq('track_id', trackId)

// Ratings
supabase.from('track_detailed_ratings').select('*')
```

### 4. Real-time Subscriptions Example
```typescript
// Subscribe to comments
supabase
  .channel('track-comments')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'track_comments' },
    handleCommentChange
  )
  .subscribe()
```

## 📱 Mobile-Specific Considerations

1. **File Upload**: Use Supabase Storage SDK
2. **Audio Playback**: Consider using native audio players
3. **Offline Support**: Cache tracks locally
4. **Waveform**: Optional - can skip for mobile
5. **Themes**: 6 themes available (Forest, Ocean, Sunset, Midnight, Lavender, Coral)

## 🔧 Recent Bug Fixes Applied
- Fixed 406 errors with view_preferences table
- Fixed file upload issues with special characters
- All users now have proper profile records
- Enhanced filename sanitization

## 📞 Support Functions Available

### Reorder Tasks
```sql
FUNCTION reorder_tasks(p_track_id uuid, p_task_id uuid, p_new_position integer)
```

### Auto-complete Subtasks
Tasks with dependencies auto-complete when parent completes.

## 💡 Implementation Tips

1. **Start Simple**: Focus on core Track and Playlist features first
2. **Use Existing Auth**: Leverage Supabase Auth SDK
3. **Match Categories**: Use the same 6 track categories
4. **Respect RLS**: Let Supabase handle data isolation
5. **Real-time Optional**: Add subscriptions after core features work

## 🎯 Quick Checklist for Mobile Sync

- [ ] Update Track interface with new fields (tuning, lyrics)
- [ ] Add Task interface and functionality
- [ ] Implement comment system
- [ ] Add rating categories (vibe, lyrics, melody, etc.)
- [ ] Update genre list (26 genres)
- [ ] Reorganize musical keys (major/minor pairs)
- [ ] Connect to same Supabase project
- [ ] Test file upload with special characters
- [ ] Implement proper error handling for 406 errors

---

*This document contains all the essential information needed to sync the mobile app with the current web app structure. Share this entire file with your mobile project.*