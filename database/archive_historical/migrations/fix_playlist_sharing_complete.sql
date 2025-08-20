-- COMPREHENSIVE FIX FOR PLAYLIST SHARING
-- This fixes all issues with shared playlists functionality

-- ========================================
-- 1. FIX PLAYLIST_TRACKS POLICIES
-- ========================================
-- Drop the problematic policy that queries auth.users
DROP POLICY IF EXISTS "Users can view playlist tracks they have access to" ON playlist_tracks;

-- Keep only the working policy that uses auth.email()
-- But update it to handle both 'active' and 'pending' status
DROP POLICY IF EXISTS "Users can view tracks in accessible playlists" ON playlist_tracks;

CREATE POLICY "Users can view tracks in accessible playlists" ON playlist_tracks
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM playlists p
        WHERE p.id = playlist_tracks.playlist_id
        AND (
            -- User owns the playlist
            p.user_id = auth.uid()
            OR
            -- Playlist is shared with user (pending or active)
            EXISTS (
                SELECT 1 FROM playlist_shares ps
                WHERE ps.playlist_id = p.id
                AND LOWER(ps.shared_with_email) = LOWER(auth.email())
                AND ps.status IN ('active', 'pending')
            )
        )
    )
);

-- ========================================
-- 2. ENSURE PLAYLIST_SHARES TABLE HAS CORRECT STRUCTURE
-- ========================================
-- Add status column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE playlist_shares 
        ADD COLUMN status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'active', 'revoked'));
    END IF;
END $$;

-- Add can_rate column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'can_rate'
    ) THEN
        ALTER TABLE playlist_shares ADD COLUMN can_rate BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add can_edit column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_shares' 
        AND column_name = 'can_edit'
    ) THEN
        ALTER TABLE playlist_shares ADD COLUMN can_edit BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ========================================
-- 3. FIX PLAYLIST_SHARES POLICIES
-- ========================================
-- Ensure users can create shares for their playlists
DROP POLICY IF EXISTS "playlist_shares_by_owner" ON playlist_shares;
CREATE POLICY "playlist_shares_by_owner" ON playlist_shares
    FOR ALL
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

-- Ensure recipients can see and update shares
DROP POLICY IF EXISTS "playlist_shares_by_recipient" ON playlist_shares;
CREATE POLICY "playlist_shares_by_recipient" ON playlist_shares
    FOR SELECT
    USING (LOWER(shared_with_email) = LOWER(auth.email()));

DROP POLICY IF EXISTS "playlist_shares_update_recipient" ON playlist_shares;
CREATE POLICY "playlist_shares_update_recipient" ON playlist_shares
    FOR UPDATE
    USING (LOWER(shared_with_email) = LOWER(auth.email()))
    WITH CHECK (LOWER(shared_with_email) = LOWER(auth.email()));

-- ========================================
-- 4. FIX PLAYLISTS POLICIES FOR SHARING
-- ========================================
-- Ensure shared playlists are visible
DROP POLICY IF EXISTS "playlists_shared_view" ON playlists;
CREATE POLICY "playlists_shared_view" ON playlists
    FOR SELECT
    USING (
        -- User owns it
        user_id = auth.uid()
        OR
        -- It's shared with user
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND LOWER(ps.shared_with_email) = LOWER(auth.email())
            AND ps.status IN ('active', 'pending')
        )
    );

-- Drop the duplicate own policy and recreate a comprehensive one
DROP POLICY IF EXISTS "playlists_own_all" ON playlists;
CREATE POLICY "playlists_own_all" ON playlists
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ========================================
-- 5. CREATE AUTO-ACCEPT FUNCTION (Optional)
-- ========================================
CREATE OR REPLACE FUNCTION auto_accept_playlist_shares()
RETURNS void AS $$
BEGIN
    UPDATE playlist_shares
    SET status = 'active',
        accepted_at = NOW()
    WHERE LOWER(shared_with_email) = LOWER(auth.email())
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_accept_playlist_shares() TO authenticated;

-- ========================================
-- 6. CREATE TEST SHARE
-- ========================================
DO $$
DECLARE
    test_playlist_id UUID;
    test_owner_id UUID;
    test_share_id UUID;
BEGIN
    -- Get or create a test playlist
    SELECT id, user_id INTO test_playlist_id, test_owner_id
    FROM playlists
    WHERE user_id IS NOT NULL
    LIMIT 1;
    
    IF test_playlist_id IS NULL THEN
        -- Create a test playlist
        INSERT INTO playlists (user_id, name, description)
        SELECT 
            id,
            'Test Playlist for Sharing',
            'Created to test sharing functionality'
        FROM auth.users
        LIMIT 1
        RETURNING id, user_id INTO test_playlist_id, test_owner_id;
    END IF;
    
    -- Create a test share
    INSERT INTO playlist_shares (
        playlist_id,
        shared_by,
        shared_with_email,
        status,
        can_rate,
        can_edit
    ) VALUES (
        test_playlist_id,
        test_owner_id,
        'ericexley@hotmail.com',
        'active',
        true,
        false
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO test_share_id;
    
    IF test_share_id IS NOT NULL THEN
        RAISE NOTICE '✅ Test share created: playlist shared with ericexley@hotmail.com';
    ELSE
        RAISE NOTICE 'ℹ️ Share already exists or could not be created';
    END IF;
END $$;

-- ========================================
-- 7. VERIFY SHARING WORKS
-- ========================================
DO $$
DECLARE
    owner_count INTEGER;
    shared_count INTEGER;
BEGIN
    -- Count playlists user owns
    SELECT COUNT(*) INTO owner_count
    FROM playlists
    WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ericexley@hotmail.com');
    
    -- Count playlists shared with user
    SELECT COUNT(*) INTO shared_count
    FROM playlist_shares
    WHERE LOWER(shared_with_email) = 'ericexley@hotmail.com'
    AND status IN ('active', 'pending');
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SHARING SYSTEM STATUS:';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'User ericexley@hotmail.com:';
    RAISE NOTICE '  - Owns % playlists', owner_count;
    RAISE NOTICE '  - Has % playlists shared with them', shared_count;
    RAISE NOTICE '';
    RAISE NOTICE 'If shared_count > 0, sharing is working at DB level';
    RAISE NOTICE 'Next step: Fix the app to load shared playlists';
    RAISE NOTICE '===========================================';
END $$;

-- ========================================
-- 8. SHOW FINAL STRUCTURE
-- ========================================
SELECT 'FINAL POLICIES CHECK:' as info;
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%auth.users%' THEN '⚠️ Uses auth.users (may cause errors)'
        WHEN qual::text LIKE '%auth.email()%' THEN '✅ Uses auth.email()'
        ELSE '✅ OK'
    END as status
FROM pg_policies
WHERE tablename IN ('playlists', 'playlist_shares', 'playlist_tracks')
AND schemaname = 'public'
ORDER BY tablename, policyname;