-- CRITICAL: Add policy to allow users to view shared playlists
-- Without this, collaborators cannot see playlists shared with them

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