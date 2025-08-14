-- STANDARDIZE SHARING COLUMNS
-- Fix column naming to match frontend expectations

-- 1. First, ensure profiles table has all users
INSERT INTO profiles (id, email, created_at)
SELECT DISTINCT 
    auth.uid(),
    auth.email(),
    NOW()
WHERE auth.uid() IS NOT NULL 
AND auth.email() IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
ON CONFLICT (id) DO NOTHING;

-- 2. Standardize column names
DO $$
BEGIN
    -- Rename share_status to status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'share_status'
    ) THEN
        ALTER TABLE playlist_shares RENAME COLUMN share_status TO status;
        RAISE NOTICE 'Renamed share_status to status';
    END IF;

    -- Add invited_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'invited_at'
    ) THEN
        ALTER TABLE playlist_shares ADD COLUMN invited_at TIMESTAMPTZ;
        UPDATE playlist_shares SET invited_at = COALESCE(created_at, NOW());
        ALTER TABLE playlist_shares ALTER COLUMN invited_at SET DEFAULT NOW();
        RAISE NOTICE 'Added invited_at column';
    END IF;

    -- Change status values from 'active' to 'accepted' if needed
    UPDATE playlist_shares 
    SET status = 'accepted' 
    WHERE status = 'active';
    
    -- Update the check constraint
    ALTER TABLE playlist_shares DROP CONSTRAINT IF EXISTS playlist_shares_share_status_check;
    ALTER TABLE playlist_shares DROP CONSTRAINT IF EXISTS playlist_shares_status_check;
    ALTER TABLE playlist_shares ADD CONSTRAINT playlist_shares_status_check 
        CHECK (status IN ('pending', 'accepted', 'declined', 'active'));
END $$;

-- 3. Drop and recreate all RLS policies with correct column names
-- Drop old policies
DROP POLICY IF EXISTS "Users see relevant shares" ON playlist_shares;
DROP POLICY IF EXISTS "Recipients can respond to shares" ON playlist_shares;
DROP POLICY IF EXISTS "Users can view own and shared playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view playlist tracks they have access to" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can view own tracks and shared playlist tracks" ON tracks;

-- Recreate with correct column names
CREATE POLICY "Users see relevant shares" ON playlist_shares
  FOR SELECT
  USING (
    shared_by = auth.uid() OR 
    LOWER(shared_with_email) = LOWER(auth.email())
  );

CREATE POLICY "Recipients can respond to shares" ON playlist_shares
  FOR UPDATE
  USING (
    LOWER(shared_with_email) = LOWER(auth.email())
  )
  WITH CHECK (
    LOWER(shared_with_email) = LOWER(auth.email())
  );

CREATE POLICY "Users can view own and shared playlists" ON playlists
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_shares
      WHERE playlist_id = playlists.id
      AND LOWER(shared_with_email) = LOWER(auth.email())
      AND status IN ('accepted', 'active')
    )
  );

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
          AND ps.status IN ('accepted', 'active')
        )
      )
    )
  );

CREATE POLICY "Users can view own tracks and shared playlist tracks" ON tracks
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
      WHERE pt.track_id = tracks.id
      AND LOWER(ps.shared_with_email) = LOWER(auth.email())
      AND ps.status IN ('accepted', 'active')
    )
  );

-- 4. Update the auto-accept function
CREATE OR REPLACE FUNCTION auto_accept_playlist_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE playlist_shares
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE 
    LOWER(shared_with_email) = LOWER(auth.email())
    AND status = 'pending';
END;
$$;

-- 5. Auto-accept any pending shares for current user
SELECT auto_accept_playlist_shares();

-- 6. Verify the fix
SELECT 
    'Verification' as section,
    auth.email() as your_email,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_shares,
    COUNT(*) FILTER (WHERE status IN ('accepted', 'active')) as active_shares,
    COUNT(*) as total_shares
FROM playlist_shares
WHERE LOWER(shared_with_email) = LOWER(auth.email());

-- 7. Show column structure
SELECT 
    'Column Structure' as section,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'playlist_shares'
ORDER BY ordinal_position;