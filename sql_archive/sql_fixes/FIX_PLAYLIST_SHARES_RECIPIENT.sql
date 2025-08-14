-- Add policy for recipients to view playlist shares sent to them
-- This is critical for collaborators to access shared playlists

CREATE POLICY "Users can view shares where they are recipient" ON playlist_shares
  FOR SELECT
  USING (
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );