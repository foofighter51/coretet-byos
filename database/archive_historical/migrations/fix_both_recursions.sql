-- FIX BOTH SIDES OF THE RECURSION
-- The issue: playlist_shares policies reference playlists, and playlists policies reference playlist_shares

-- ========================================
-- 1. SHOW THE PROBLEMATIC POLICIES
-- ========================================
SELECT 'PROBLEMATIC POLICIES CAUSING RECURSION:' as info;
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual::text LIKE '%playlists%' AND tablename = 'playlist_shares' THEN '❌ RECURSION: playlist_shares → playlists'
        WHEN qual::text LIKE '%playlist_shares%' AND tablename = 'playlists' THEN '❌ RECURSION: playlists → playlist_shares'
        ELSE 'OK'
    END as issue
FROM pg_policies
WHERE tablename IN ('playlists', 'playlist_shares')
AND (qual::text LIKE '%playlists%' OR qual::text LIKE '%playlist_shares%');

-- ========================================
-- 2. FIX PLAYLISTS POLICIES
-- ========================================
-- Drop ALL playlists policies to start fresh
DROP POLICY IF EXISTS "playlists_select_own" ON playlists;
DROP POLICY IF EXISTS "playlists_select_shared" ON playlists;
DROP POLICY IF EXISTS "playlists_own" ON playlists;
DROP POLICY IF EXISTS "playlists_shared" ON playlists;
DROP POLICY IF EXISTS "playlists_insert_own" ON playlists;
DROP POLICY IF EXISTS "playlists_update_own" ON playlists;
DROP POLICY IF EXISTS "playlists_delete_own" ON playlists;

-- Create simple, non-recursive policies for playlists
CREATE POLICY "playlists_own_all" ON playlists
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- For shared playlists, we'll handle this differently (see step 4)

-- ========================================
-- 3. FIX PLAYLIST_SHARES POLICIES  
-- ========================================
-- Drop ALL playlist_shares policies
DROP POLICY IF EXISTS "playlist_shares_select" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_insert" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_update" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_delete" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_all" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_simple" ON playlist_shares;
DROP POLICY IF EXISTS "playlist_shares_manage" ON playlist_shares;

-- Create simple policies that DON'T reference back to playlists
CREATE POLICY "playlist_shares_by_owner" ON playlist_shares
    FOR ALL
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "playlist_shares_by_recipient" ON playlist_shares
    FOR SELECT
    USING (
        LOWER(shared_with_email) = (
            SELECT LOWER(email) 
            FROM auth.users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

CREATE POLICY "playlist_shares_update_recipient" ON playlist_shares
    FOR UPDATE
    USING (
        LOWER(shared_with_email) = (
            SELECT LOWER(email) 
            FROM auth.users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    )
    WITH CHECK (
        LOWER(shared_with_email) = (
            SELECT LOWER(email) 
            FROM auth.users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

-- ========================================
-- 4. ADD SHARED PLAYLIST ACCESS (WITHOUT RECURSION)
-- ========================================
-- Now we can safely add a policy for viewing shared playlists
-- This ONLY goes one direction: playlists → playlist_shares
CREATE POLICY "playlists_shared_view" ON playlists
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND LOWER(ps.shared_with_email) = (
                SELECT LOWER(email) 
                FROM auth.users 
                WHERE id = auth.uid() 
                LIMIT 1
            )
        )
    );

-- ========================================
-- 5. CREATE/VERIFY VIEW_PREFERENCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_type, view_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_view_preferences_user ON view_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_view_preferences_type ON view_preferences(view_type, view_id);

-- Enable RLS if not already enabled
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "view_preferences_select" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_insert" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_update" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_delete" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_all" ON view_preferences;

CREATE POLICY "view_preferences_all" ON view_preferences
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT ALL ON view_preferences TO anon;
GRANT ALL ON view_preferences TO service_role;

-- ========================================
-- 6. VERIFY THE FIXES
-- ========================================
DO $$
DECLARE
    test_passed BOOLEAN := true;
    error_msg TEXT;
    error_detail TEXT;
BEGIN
    -- Test 1: Query playlists
    BEGIN
        PERFORM 1 FROM playlists WHERE user_id = '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f' LIMIT 1;
        RAISE NOTICE '✅ Test 1 PASSED: Playlists query works (no recursion)';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS 
            error_msg = MESSAGE_TEXT,
            error_detail = PG_EXCEPTION_DETAIL;
        RAISE NOTICE '❌ Test 1 FAILED: %', error_msg;
        IF error_detail IS NOT NULL THEN
            RAISE NOTICE 'Detail: %', error_detail;
        END IF;
        test_passed := false;
    END;
    
    -- Test 2: Query view_preferences
    BEGIN
        PERFORM 1 FROM view_preferences LIMIT 1;
        RAISE NOTICE '✅ Test 2 PASSED: view_preferences accessible';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 2 FAILED: %', error_msg;
        test_passed := false;
    END;
    
    -- Test 3: Query playlist_shares
    BEGIN
        PERFORM 1 FROM playlist_shares LIMIT 1;
        RAISE NOTICE '✅ Test 3 PASSED: playlist_shares accessible';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 3 FAILED: %', error_msg;
        test_passed := false;
    END;
    
    IF test_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE '===========================================';
        RAISE NOTICE '🎉 ALL RECURSION FIXED!';
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'Fixed issues:';
        RAISE NOTICE '✅ Removed circular references between tables';
        RAISE NOTICE '✅ Created view_preferences table';
        RAISE NOTICE '✅ All policies are now simple and direct';
        RAISE NOTICE '';
        RAISE NOTICE 'The app should work without 500 or 406 errors.';
        RAISE NOTICE '===========================================';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ Some tests failed. Review errors above.';
    END IF;
END $$;

-- ========================================
-- 7. SHOW FINAL POLICY STRUCTURE
-- ========================================
SELECT 
    'FINAL POLICY STRUCTURE (should have no cross-references):' as info;
    
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN tablename = 'playlists' AND qual::text LIKE '%playlist_shares%' THEN 'One-way reference (OK)'
        WHEN tablename = 'playlist_shares' AND qual::text LIKE '%playlists%' THEN '⚠️ STILL HAS RECURSION!'
        ELSE '✅ No cross-reference'
    END as status
FROM pg_policies
WHERE tablename IN ('playlists', 'playlist_shares', 'view_preferences')
ORDER BY tablename, policyname;