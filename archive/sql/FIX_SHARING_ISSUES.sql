-- FIX SHARING ISSUES
-- Based on the console errors

-- 1. Check if the user's profile exists
SELECT 
    'User Profile Check' as test,
    auth.uid() as user_id,
    auth.email() as email,
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) as profile_exists;

-- 2. Create profile if missing
INSERT INTO profiles (id, email, created_at)
SELECT 
    auth.uid(),
    auth.email(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid());

-- 3. Check playlist_shares table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'playlist_shares'
ORDER BY ordinal_position;

-- 4. Check if share_status column exists (error says "status" doesn't exist)
SELECT 
    'Column Check' as test,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'status'
    ) as status_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'share_status'
    ) as share_status_exists;

-- 5. If needed, rename share_status to status for compatibility
DO $$
BEGIN
    -- Check if we have share_status but not status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'share_status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE playlist_shares RENAME COLUMN share_status TO status;
        RAISE NOTICE 'Renamed share_status to status';
    END IF;
END $$;

-- 6. Check invited_at column (used in queries)
DO $$
BEGIN
    -- Add invited_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'invited_at'
    ) THEN
        ALTER TABLE playlist_shares ADD COLUMN invited_at TIMESTAMPTZ DEFAULT NOW();
        -- Copy created_at to invited_at for existing records
        UPDATE playlist_shares SET invited_at = created_at WHERE invited_at IS NULL;
        RAISE NOTICE 'Added invited_at column';
    END IF;
END $$;

-- 7. Update RLS policies to match column names
DROP POLICY IF EXISTS "Users can view own and shared playlists" ON playlists;

CREATE POLICY "Users can view own and shared playlists" ON playlists
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM playlist_shares
      WHERE playlist_id = playlists.id
      AND LOWER(shared_with_email) = LOWER(auth.email())
      AND status = 'accepted'  -- Using status instead of share_status
    )
  );

-- 8. Check for any pending shares for this user
SELECT 
    'Pending Shares' as section,
    ps.*,
    p.name as playlist_name
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email());

-- 9. Auto-accept pending shares
UPDATE playlist_shares
SET 
    status = 'accepted',
    accepted_at = NOW()
WHERE 
    LOWER(shared_with_email) = LOWER(auth.email())
    AND status = 'pending';

-- 10. Final verification
SELECT 
    'Final Check' as status,
    (SELECT COUNT(*) FROM profiles WHERE id = auth.uid()) as profile_exists,
    (SELECT COUNT(*) FROM playlist_shares WHERE LOWER(shared_with_email) = LOWER(auth.email())) as shares_for_user,
    (SELECT COUNT(*) FROM playlist_shares WHERE LOWER(shared_with_email) = LOWER(auth.email()) AND status = 'accepted') as accepted_shares;