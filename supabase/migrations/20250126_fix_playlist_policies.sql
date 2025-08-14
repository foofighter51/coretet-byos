-- Fix playlist RLS policies that may have been affected by collaborator migrations

-- First ensure the playlists table policies are correctly set
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;

-- Recreate core playlist policies
CREATE POLICY "Users can view their own playlists" ON playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" ON playlists
  FOR DELETE USING (auth.uid() = user_id);

-- Fix playlist_tracks policies
DROP POLICY IF EXISTS "Users can view tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can view playlist tracks they have access to" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks to their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks from their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can reorder tracks in their playlists" ON playlist_tracks;

-- Create comprehensive playlist_tracks policies
CREATE POLICY "Users can view playlist tracks they have access to" ON playlist_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND (
        playlists.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM playlist_shares ps
          WHERE ps.playlist_id = playlists.id
          AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND ps.status = 'active'
        )
      )
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

CREATE POLICY "Users can update tracks in their playlists" ON playlist_tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Also ensure tracks policies are correct
DROP POLICY IF EXISTS "Users can view tracks they have access to" ON tracks;

CREATE POLICY "Users can view tracks they have access to" ON tracks
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      LEFT JOIN playlist_shares ps ON ps.playlist_id = p.id
      WHERE pt.track_id = tracks.id
      AND (
        p.user_id = auth.uid() OR 
        (ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND ps.status = 'active')
      )
    )
  );