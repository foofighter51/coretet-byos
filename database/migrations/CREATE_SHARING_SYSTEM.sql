-- CREATE PLAYLIST SHARING SYSTEM
-- This implements secure playlist sharing with account-based access

-- 1. Create playlist_shares table
CREATE TABLE IF NOT EXISTS playlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id),
  shared_with_email TEXT NOT NULL,
  share_status TEXT DEFAULT 'pending' CHECK (share_status IN ('pending', 'accepted', 'declined')),
  can_rate BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,  -- for future use
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique shares per playlist/email combo
  UNIQUE(playlist_id, shared_with_email)
);

-- 2. Create indexes for performance
CREATE INDEX idx_playlist_shares_playlist_id ON playlist_shares(playlist_id);
CREATE INDEX idx_playlist_shares_shared_with ON playlist_shares(shared_with_email);
CREATE INDEX idx_playlist_shares_status ON playlist_shares(share_status);

-- 3. Enable RLS
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for playlist_shares

-- Owners can share their playlists
CREATE POLICY "Owners can share their playlists" ON playlist_shares
  FOR INSERT 
  WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = playlist_id 
      AND user_id = auth.uid()
    )
  );

-- Owners can update their shares (revoke, change permissions)
CREATE POLICY "Owners can update their shares" ON playlist_shares
  FOR UPDATE
  USING (shared_by = auth.uid())
  WITH CHECK (shared_by = auth.uid());

-- Owners can delete their shares (revoke access)
CREATE POLICY "Owners can delete their shares" ON playlist_shares
  FOR DELETE
  USING (shared_by = auth.uid());

-- Users can see shares they created or received
CREATE POLICY "Users see relevant shares" ON playlist_shares
  FOR SELECT
  USING (
    shared_by = auth.uid() OR 
    LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Recipients can update their own share status (accept/decline)
CREATE POLICY "Recipients can respond to shares" ON playlist_shares
  FOR UPDATE
  USING (
    LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- 5. Update playlists RLS to include shared access
DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;

CREATE POLICY "Users can view own and shared playlists" ON playlists
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_shares
      WHERE playlist_id = playlists.id
      AND LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
      AND share_status = 'accepted'
    )
  );

-- 6. Update playlist_tracks RLS to include shared access
DROP POLICY IF EXISTS "Users can view playlist tracks" ON playlist_tracks;

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
          AND LOWER(ps.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
          AND ps.share_status = 'accepted'
        )
      )
    )
  );

-- 7. Update tracks RLS to include shared playlist tracks
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;

CREATE POLICY "Users can view own tracks and shared playlist tracks" ON tracks
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
      WHERE pt.track_id = tracks.id
      AND LOWER(ps.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
      AND ps.share_status = 'accepted'
    )
  );

-- 8. Create function to accept share automatically on first login
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
    LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND share_status = 'pending';
END;
$$;

-- 9. Create view for easy access to shared playlists
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
  LOWER(ps.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND ps.share_status = 'accepted';

-- 10. Test the setup
SELECT 
  'Sharing system created successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'playlist_shares') as table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'playlist_shares') as policies_count;

-- 11. Grant permissions for the view
GRANT SELECT ON my_shared_playlists TO authenticated;

-- Instructions for testing:
-- 1. Run this SQL in Supabase
-- 2. Test sharing a playlist with another user
-- 3. Have the recipient log in to auto-accept
-- 4. Verify both users can see the playlist