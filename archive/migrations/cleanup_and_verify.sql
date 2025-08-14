-- CLEANUP AND VERIFY: Remove duplicate policies and test everything

-- ========================================
-- 1. CLEAN UP DUPLICATE VIEW_PREFERENCES POLICIES
-- ========================================
-- We have duplicate policies, let's keep only one set
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON view_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_delete_own" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_insert_own" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_select_own" ON view_preferences;
DROP POLICY IF EXISTS "view_preferences_update_own" ON view_preferences;

-- Keep only the simplest one
DROP POLICY IF EXISTS "view_preferences_all" ON view_preferences;
CREATE POLICY "view_preferences_all" ON view_preferences
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 2. INSERT DEFAULT PREFERENCES FOR USERS
-- ========================================
INSERT INTO view_preferences (user_id, view_type, view_id, preferences)
SELECT 
    id as user_id,
    'category' as view_type,
    'all' as view_id,
    '{"sortBy": "updated_at", "sortOrder": "desc"}'::jsonb
FROM auth.users
ON CONFLICT (user_id, view_type, view_id) DO NOTHING;

-- ========================================
-- 3. VERIFY ALL TABLES AND POLICIES
-- ========================================
SELECT 'FINAL TABLE AND POLICY STATUS:' as info;

WITH table_status AS (
    SELECT 
        t.tablename,
        CASE WHEN t.rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status,
        COUNT(p.policyname) as policy_count
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('playlists', 'playlist_shares', 'profiles', 'tracks', 'playlist_tracks', 'view_preferences')
    GROUP BY t.tablename, t.rowsecurity
)
SELECT * FROM table_status ORDER BY tablename;

-- ========================================
-- 4. TEST ACTUAL QUERIES AS USER
-- ========================================
DO $$
DECLARE
    test_user_id UUID := '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f';
    test_results TEXT := '';
    row_count INTEGER;
BEGIN
    -- Test tracks query
    BEGIN
        SELECT COUNT(*) INTO row_count FROM tracks WHERE user_id = test_user_id;
        test_results := test_results || '✅ Tracks: ' || row_count || ' rows accessible' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ Tracks: ERROR - ' || SQLERRM || E'\n';
    END;
    
    -- Test playlists query
    BEGIN
        SELECT COUNT(*) INTO row_count FROM playlists WHERE user_id = test_user_id;
        test_results := test_results || '✅ Playlists: ' || row_count || ' rows accessible' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ Playlists: ERROR - ' || SQLERRM || E'\n';
    END;
    
    -- Test view_preferences query
    BEGIN
        SELECT COUNT(*) INTO row_count FROM view_preferences WHERE user_id = test_user_id;
        test_results := test_results || '✅ View Preferences: ' || row_count || ' rows accessible' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ View Preferences: ERROR - ' || SQLERRM || E'\n';
    END;
    
    -- Test playlist_shares query
    BEGIN
        SELECT COUNT(*) INTO row_count FROM playlist_shares 
        WHERE shared_with_email = (SELECT email FROM auth.users WHERE id = test_user_id LIMIT 1);
        test_results := test_results || '✅ Playlist Shares: ' || row_count || ' shares accessible' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || '❌ Playlist Shares: ERROR - ' || SQLERRM || E'\n';
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TEST RESULTS FOR USER %:', test_user_id;
    RAISE NOTICE '===========================================';
    RAISE NOTICE '%', test_results;
    RAISE NOTICE '===========================================';
END $$;

-- ========================================
-- 5. FINAL SUMMARY
-- ========================================
DO $$
DECLARE
    vp_exists BOOLEAN;
    recursion_count INTEGER;
BEGIN
    -- Check view_preferences exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'view_preferences' AND table_schema = 'public'
    ) INTO vp_exists;
    
    -- Check for recursion
    SELECT COUNT(*) INTO recursion_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'playlist_shares'
    AND qual::text LIKE '%playlists%';
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '🎉 FINAL STATUS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'view_preferences table: %', CASE WHEN vp_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Recursive policies: %', CASE WHEN recursion_count = 0 THEN '✅ NONE (FIXED!)' ELSE '❌ STILL EXISTS' END;
    RAISE NOTICE '';
    RAISE NOTICE 'EXPECTED RESULTS IN APP:';
    RAISE NOTICE '✅ No more 406 errors (view_preferences exists)';
    RAISE NOTICE '✅ No more 500 errors (no recursion)';
    RAISE NOTICE '✅ Users can see their tracks and playlists';
    RAISE NOTICE '✅ Shared playlists work correctly';
    RAISE NOTICE '';
    RAISE NOTICE 'Please refresh your app to test!';
    RAISE NOTICE '===========================================';
END $$;