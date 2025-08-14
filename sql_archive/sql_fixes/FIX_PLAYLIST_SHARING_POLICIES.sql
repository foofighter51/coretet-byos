-- Fix RLS policies to allow collaborators to view shared playlists

-- 1. First check current policies on playlists table
SELECT 'Current playlists policies:' as info;
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'playlists'
ORDER BY policyname;

-- 2. Add missing policy for viewing shared playlists
-- This allows users to see playlists that have been shared with them
CREATE POLICY "Users can view playlists shared with them" ON playlists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlist_shares ps
      WHERE ps.playlist_id = playlists.id
      AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND ps.status = 'active'
    )
  );

-- 3. Ensure playlist_shares table has proper policies
-- Users should be able to view shares where they are the recipient
DROP POLICY IF EXISTS "Users can view shares where they are recipient" ON playlist_shares;
CREATE POLICY "Users can view shares where they are recipient" ON playlist_shares
  FOR SELECT
  USING (
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 4. Verify the policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'playlists'
ORDER BY policyname;

-- 5. Also check playlist_shares policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'playlist_shares'
ORDER BY policyname;