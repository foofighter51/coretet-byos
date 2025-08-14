-- Emergency fix for playlist_tracks 403 error

-- Drop all existing policies on playlist_tracks to start fresh
DROP POLICY IF EXISTS "Users can view tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can view playlist tracks they have access to" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can view their playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks to their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks from their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can reorder tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can update tracks in their playlists" ON playlist_tracks;

-- Create simple, working policy for viewing playlist tracks
CREATE POLICY "Users can view their playlist tracks" ON playlist_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Policy for adding tracks to own playlists
CREATE POLICY "Users can add tracks to their playlists" ON playlist_tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Policy for removing tracks from own playlists
CREATE POLICY "Users can remove tracks from their playlists" ON playlist_tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Policy for updating tracks in own playlists (for reordering)
CREATE POLICY "Users can update tracks in their playlists" ON playlist_tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );