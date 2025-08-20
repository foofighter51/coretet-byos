# Rebuild Analysis - What to Keep vs. Start Fresh

## Current State Assessment

### What's Working Well ✅
1. **Core data model** - tracks, playlists, playlist_tracks tables are solid
2. **UI/UX** - Clean interface, good player, drag-and-drop works
3. **Upload flow** - Edge function handles files well
4. **Basic features** - Categories, tags, search, playlists

### What's Problematic ❌
1. **Storage authentication** - Signed URLs don't work properly
2. **Over-engineered RLS** - Policies are too complex, causing recursion
3. **Mixed purposes** - Collaborator/sharing features half-implemented
4. **Tech debt** - S3 migration artifacts, unused columns
5. **No clear auth strategy** - Service role vs anon key confusion

## Recommended Approach: Strategic Rebuild

### Keep These (they're solid):
```
- Frontend React components
- Basic database schema (tracks, playlists)
- UI/UX design
- Upload edge function (just needs minor tweaks)
```

### Rebuild These (clean slate):
```
1. Storage strategy
2. RLS policies  
3. Authentication flow
4. Sharing mechanism
```

## The Clean Storage Architecture

### Option 1: Public Bucket + Database Security (Simplest)
```sql
-- Buckets are public, security via database
-- Files have unguessable UUIDs, tracks table controls access
CREATE POLICY "Users see own tracks" ON tracks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see shared tracks" ON tracks
  FOR SELECT USING (
    auth.uid() = user_id OR 
    id IN (
      SELECT track_id FROM playlist_tracks pt
      JOIN playlist_shares ps ON pt.playlist_id = ps.playlist_id
      WHERE ps.shared_with = auth.uid()
    )
  );
```

### Option 2: Edge Function Gateway (Most Flexible)
```typescript
// All file access goes through edge function
// Frontend never touches storage directly
async function getTrackUrl(trackId: string) {
  const { data } = await supabase.functions.invoke('get-track-url', {
    body: { trackId }
  });
  return data.url;
}

// Edge function handles all security checks
// Can easily switch storage providers later
```

### Option 3: Proper Signed URLs (Most Complex)
```sql
-- Requires specific RLS configuration
-- Must understand Supabase's internal auth flow
-- Not well documented, as we discovered
```

## Recommended Migration Plan

### Phase 1: Clean Database (30 min)
```sql
-- 1. Export your tracks data
COPY (SELECT * FROM tracks WHERE user_id = 'your-id') 
TO '/tmp/my_tracks.csv' CSV HEADER;

-- 2. Drop everything and rebuild
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 3. Create clean schema
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  duration INTEGER,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  UNIQUE(playlist_id, position)
);

-- 4. Simple, working RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tracks" ON tracks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own playlists" ON playlists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own playlist tracks" ON playlist_tracks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = playlist_tracks.playlist_id 
      AND user_id = auth.uid()
    )
  );
```

### Phase 2: Storage Decision (10 min)
```sql
-- Option A: Public bucket (recommended for now)
UPDATE storage.buckets SET public = true WHERE id = 'audio-files';

-- Option B: Edge function gateway
-- Deploy get-track-url function
-- Update frontend to use function instead of direct storage
```

### Phase 3: Future Features (when needed)
```typescript
// 1. Sharing system
interface ShareSystem {
  sharePlaylist(playlistId: string, email: string): Promise<void>;
  getSharedPlaylists(): Promise<Playlist[]>;
}

// 2. Ratings system  
interface RatingSystem {
  rateTrack(trackId: string, rating: number): Promise<void>;
  getAverageRating(trackId: string): Promise<number>;
}

// 3. AI Analysis
interface AnalysisSystem {
  analyzeTrack(trackId: string): Promise<AudioFeatures>;
  getSimilarTracks(trackId: string): Promise<Track[]>;
}
```

## My Recommendation

**Do a strategic partial rebuild:**

1. **Keep**: Your frontend, basic tables, UI/UX
2. **Simplify**: Use public bucket + database RLS
3. **Delete**: Complex RLS policies, sharing tables (for now)
4. **Plan**: Add features incrementally when needed

This gives you:
- Working app TODAY
- Clean foundation
- Clear upgrade path
- No technical debt

Want me to create the migration scripts?