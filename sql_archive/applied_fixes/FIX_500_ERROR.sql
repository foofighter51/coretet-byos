-- Fix 500 errors by checking policy conflicts

-- 1. List ALL policies on tracks table
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- 2. List ALL policies on playlists table
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'playlists'
ORDER BY policyname;

-- 3. Check for duplicate or conflicting SELECT policies
-- Multiple SELECT policies with USING clauses can cause issues
SELECT 
  tablename,
  COUNT(*) as select_policy_count
FROM pg_policies 
WHERE cmd = 'SELECT'
AND tablename IN ('tracks', 'playlists')
GROUP BY tablename
HAVING COUNT(*) > 1;

-- 4. Drop potential duplicate policies and recreate clean ones
-- For tracks table
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view tracks in shared playlists" ON tracks;

-- Create a single combined policy for tracks
CREATE POLICY "Users can view accessible tracks" ON tracks
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      JOIN playlist_shares ps ON ps.playlist_id = p.id
      WHERE pt.track_id = tracks.id
      AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND ps.status = 'active'
    )
  );

-- For playlists table
DROP POLICY IF EXISTS "Enable all for authenticated users own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view playlists shared with them" ON playlists;

-- Create separate policies for different operations
CREATE POLICY "Users can select own or shared playlists" ON playlists
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM playlist_shares ps
      WHERE ps.playlist_id = playlists.id
      AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND ps.status = 'active'
    )
  );

CREATE POLICY "Users can manage own playlists" ON playlists
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());