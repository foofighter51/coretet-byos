-- Final check of all policies after fixes

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('playlists', 'playlist_shares', 'tracks')
AND (
  policyname LIKE '%shared%' OR 
  policyname LIKE '%recipient%'
)
ORDER BY tablename, policyname;

-- Should show:
-- playlists: "Users can view playlists shared with them"
-- playlist_shares: "Users can view shares where they are recipient"  
-- tracks: "Users can view tracks in shared playlists"