-- CRITICAL FIX: Remove overly permissive tracks policy
-- This policy is allowing collaborators to see ALL tracks

-- 1. Drop the problematic policy that's exposing all tracks
DROP POLICY IF EXISTS "Users can view tracks they have access to" ON tracks;

-- 2. Create restrictive policies that properly isolate tracks
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view tracks in shared playlists" ON tracks;

-- Users can only see their own tracks
CREATE POLICY "Users can view own tracks" ON tracks
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can see tracks that are in playlists shared with them
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

-- 3. Verify the fix by checking what policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;