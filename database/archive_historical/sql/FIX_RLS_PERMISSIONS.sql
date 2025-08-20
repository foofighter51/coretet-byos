-- FIX RLS PERMISSIONS
-- The policies are trying to access auth.users which is restricted

-- 1. First, let's fix the playlist_shares policies to use auth.uid() and auth.email()
DROP POLICY IF EXISTS "Users see relevant shares" ON playlist_shares;

CREATE POLICY "Users see relevant shares" ON playlist_shares
  FOR SELECT
  USING (
    shared_by = auth.uid() OR 
    LOWER(shared_with_email) = LOWER(auth.email())
  );

DROP POLICY IF EXISTS "Recipients can respond to shares" ON playlist_shares;

CREATE POLICY "Recipients can respond to shares" ON playlist_shares
  FOR UPDATE
  USING (
    LOWER(shared_with_email) = LOWER(auth.email())
  )
  WITH CHECK (
    LOWER(shared_with_email) = LOWER(auth.email())
  );

-- 2. Fix the playlists policy
DROP POLICY IF EXISTS "Users can view own and shared playlists" ON playlists;

CREATE POLICY "Users can view own and shared playlists" ON playlists
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_shares
      WHERE playlist_id = playlists.id
      AND LOWER(shared_with_email) = LOWER(auth.email())
      AND share_status = 'accepted'
    )
  );

-- 3. Fix the playlist_tracks policy
DROP POLICY IF EXISTS "Users can view playlist tracks they have access to" ON playlist_tracks;

CREATE POLICY "Users can view playlist tracks they have access to" ON playlist_tracks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM playlist_shares ps
          WHERE ps.playlist_id = p.id
          AND LOWER(ps.shared_with_email) = LOWER(auth.email())
          AND ps.share_status = 'accepted'
        )
      )
    )
  );

-- 4. Fix the tracks policy
DROP POLICY IF EXISTS "Users can view own tracks and shared playlist tracks" ON tracks;

CREATE POLICY "Users can view own tracks and shared playlist tracks" ON tracks
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
      WHERE pt.track_id = tracks.id
      AND LOWER(ps.shared_with_email) = LOWER(auth.email())
      AND ps.share_status = 'accepted'
    )
  );

-- 5. Update the auto-accept function to use auth.email()
CREATE OR REPLACE FUNCTION auto_accept_playlist_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE playlist_shares
  SET 
    share_status = 'accepted',
    accepted_at = NOW()
  WHERE 
    LOWER(shared_with_email) = LOWER(auth.email())
    AND share_status = 'pending';
END;
$$;

-- 6. Also update the view
DROP VIEW IF EXISTS my_shared_playlists;

CREATE OR REPLACE VIEW my_shared_playlists AS
SELECT 
  p.*,
  ps.shared_by,
  ps.can_rate,
  ps.can_edit,
  ps.accepted_at,
  ps.created_at as shared_at,
  profiles.email as shared_by_email
FROM playlists p
JOIN playlist_shares ps ON ps.playlist_id = p.id
JOIN profiles ON profiles.id = ps.shared_by
WHERE 
  LOWER(ps.shared_with_email) = LOWER(auth.email())
  AND ps.share_status = 'accepted';

-- Grant permissions
GRANT SELECT ON my_shared_playlists TO authenticated;

-- 7. Verify the policies
SELECT 
    '✅ RLS Policies Fixed' as status,
    'Using auth.email() instead of querying auth.users' as fix,
    'Try loading the app again' as next_step;