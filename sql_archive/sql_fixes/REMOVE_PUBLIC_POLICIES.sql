-- CRITICAL: Remove dangerous public policies that allow anyone to access tracks

-- 1. Drop the temporary public policies that are exposing everything
DROP POLICY IF EXISTS "Temporary public select tracks" ON tracks;
DROP POLICY IF EXISTS "Temporary public insert tracks" ON tracks;

-- 2. Verify they're gone and check remaining policies
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

-- The remaining policies should be:
-- - Users can delete own tracks (DELETE, user_id = auth.uid())
-- - Users can insert own tracks (INSERT)
-- - Users can update own tracks (UPDATE, user_id = auth.uid())
-- - Users can view own tracks (SELECT, user_id = auth.uid())
-- - Users can view tracks in shared playlists (SELECT, with proper playlist_shares check)