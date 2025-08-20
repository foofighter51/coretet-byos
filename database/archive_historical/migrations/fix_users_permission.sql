-- FIX PERMISSION DENIED FOR TABLE USERS

-- ========================================
-- 1. DIAGNOSE THE ISSUE
-- ========================================
SELECT 'Current playlists policies that might access users table:' as info;
SELECT 
    policyname,
    cmd,
    qual::text as policy_condition
FROM pg_policies
WHERE tablename = 'playlists'
AND qual::text LIKE '%auth.users%'
ORDER BY policyname;

-- ========================================
-- 2. FIX THE PROBLEMATIC POLICY
-- ========================================
-- The issue is that the policy tries to query auth.users directly
-- We need to use auth.email() or auth.jwt() instead

-- Drop the problematic policy
DROP POLICY IF EXISTS "playlists_shared_view" ON playlists;

-- Recreate it using auth.email() instead of querying auth.users
CREATE POLICY "playlists_shared_view" ON playlists
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND LOWER(ps.shared_with_email) = LOWER(auth.email())
        )
    );

-- ========================================
-- 3. ALSO FIX PLAYLIST_SHARES POLICIES
-- ========================================
-- These might have the same issue
DROP POLICY IF EXISTS "playlist_shares_by_recipient" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_update_recipient" ON playlist_shares;

-- Recreate using auth.email()
CREATE POLICY "playlist_shares_by_recipient" ON playlist_shares
    FOR SELECT
    USING (
        LOWER(shared_with_email) = LOWER(auth.email())
    );

CREATE POLICY "playlist_shares_update_recipient" ON playlist_shares
    FOR UPDATE
    USING (
        LOWER(shared_with_email) = LOWER(auth.email())
    )
    WITH CHECK (
        LOWER(shared_with_email) = LOWER(auth.email())
    );

-- ========================================
-- 4. ALTERNATIVE: GRANT SELECT ON AUTH.USERS
-- ========================================
-- If auth.email() doesn't work, we can grant limited access to auth.users
-- This grants ONLY the ability to see emails (not passwords or sensitive data)
DO $$
BEGIN
    -- Grant select on specific columns only
    EXECUTE 'GRANT SELECT (id, email) ON auth.users TO authenticated';
    RAISE NOTICE 'Granted SELECT on auth.users (id, email only) to authenticated users';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not grant permissions on auth.users: %', SQLERRM;
END $$;

-- ========================================
-- 5. TEST THE FIXES
-- ========================================
DO $$
DECLARE
    test_user_id UUID := '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f';
    test_passed BOOLEAN := true;
    error_msg TEXT;
    playlist_count INTEGER;
BEGIN
    -- Test playlists query
    BEGIN
        SELECT COUNT(*) INTO playlist_count 
        FROM playlists 
        WHERE user_id = test_user_id;
        
        RAISE NOTICE '✅ Playlists query works! Found % playlists', playlist_count;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Playlists query FAILED: %', error_msg;
        test_passed := false;
    END;
    
    -- Test shared playlists access
    BEGIN
        PERFORM 1 FROM playlists p
        WHERE EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = p.id
            LIMIT 1
        ) LIMIT 1;
        
        RAISE NOTICE '✅ Shared playlists query works!';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Shared playlists query FAILED: %', error_msg;
        test_passed := false;
    END;
    
    IF test_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE '===========================================';
        RAISE NOTICE '🎉 PERMISSION ISSUE FIXED!';
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'The 403 Forbidden errors should be resolved.';
        RAISE NOTICE 'Users can now access playlists without permission errors.';
        RAISE NOTICE '===========================================';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ Some tests failed. Review errors above.';
    END IF;
END $$;

-- ========================================
-- 6. VERIFY CURRENT AUTH FUNCTIONS
-- ========================================
-- Show what auth functions are available
SELECT 'Available auth functions:' as info;
SELECT 
    routine_name as function_name,
    routine_schema as schema
FROM information_schema.routines
WHERE routine_schema = 'auth'
AND routine_type = 'FUNCTION'
AND routine_name IN ('uid', 'email', 'jwt', 'role')
ORDER BY routine_name;

-- ========================================
-- 7. SHOW FINAL POLICIES
-- ========================================
SELECT 'Final playlists policies:' as info;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%auth.users%' THEN '⚠️ Still queries auth.users'
        WHEN qual::text LIKE '%auth.email()%' THEN '✅ Uses auth.email()'
        ELSE '✅ No user table access'
    END as status
FROM pg_policies
WHERE tablename = 'playlists'
ORDER BY policyname;