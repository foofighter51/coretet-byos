-- PART 5: Fix tracks table permissions
-- Run this after Part 4

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view tracks they have access to" ON tracks;

-- Replace with more restrictive policies
CREATE POLICY "Users can view own tracks" ON tracks
  FOR SELECT
  USING (user_id = auth.uid());

-- Separate policy for viewing tracks in shared playlists
CREATE POLICY "Users can view tracks in shared playlists" ON tracks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      JOIN playlist_shares ps ON ps.playlist_id = p.id
      WHERE pt.track_id = tracks.id
      AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND ps.status = 'active'
    )
  );