-- PART 4: Add shared playlist file access
-- Run this after Part 3

-- Users can view files in shared playlists
CREATE POLICY "Users can view files in shared playlists" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio-files' AND
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN playlist_tracks pt ON pt.track_id = t.id
      JOIN playlists p ON p.id = pt.playlist_id
      LEFT JOIN playlist_shares ps ON ps.playlist_id = p.id
      WHERE t.storage_path = name
      AND (
        p.user_id = auth.uid() OR
        (ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND ps.status = 'active')
      )
    )
  );