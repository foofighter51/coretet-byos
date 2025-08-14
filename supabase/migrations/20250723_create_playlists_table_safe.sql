-- Safe migration script that checks for existing objects

-- Create playlists table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create playlist_tracks junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- Add indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

-- Enable RLS (safe to run multiple times)
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks to their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks from their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can reorder tracks in their playlists" ON playlist_tracks;

-- Create RLS policies for playlists
CREATE POLICY "Users can view their own playlists" ON playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" ON playlists
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for playlist_tracks
CREATE POLICY "Users can view tracks in their playlists" ON playlist_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tracks to their playlists" ON playlist_tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tracks from their playlists" ON playlist_tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can reorder tracks in their playlists" ON playlist_tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );