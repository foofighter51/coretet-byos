-- COMPREHENSIVE RLS DIAGNOSTIC SCRIPT
-- Run this to understand why the app won't load

-- =====================================================
-- 1. CHECK AUTHENTICATION CONTEXT
-- =====================================================
SELECT '=== AUTHENTICATION CHECK ===' as section;

-- Check if we're authenticated and what info is available
SELECT 
    auth.uid() IS NOT NULL as is_authenticated,
    auth.uid() as user_id,
    auth.jwt() IS NOT NULL as has_jwt,
    auth.jwt()->>'email' as jwt_email,
    auth.jwt()->>'role' as jwt_role,
    current_setting('request.jwt.claims', true)::json->>'email' as claims_email;

-- Check if the JWT has the expected structure
SELECT 
    jsonb_pretty(auth.jwt()::jsonb) as jwt_structure
WHERE auth.jwt() IS NOT NULL;

-- =====================================================
-- 2. CHECK CURRENT POLICIES
-- =====================================================
SELECT '=== CURRENT POLICIES ===' as section;

-- List all policies on our tables
SELECT 
    tablename,
    policyname,
    cmd,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_check_clause,
    length(qual::text) as using_clause_length,
    length(with_check::text) as check_clause_length
FROM pg_policies
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'user_track_ratings')
ORDER BY tablename, policyname;

-- =====================================================
-- 3. TEST SIMPLE QUERIES
-- =====================================================
SELECT '=== QUERY TESTS ===' as section;

-- Test basic SELECT queries with error handling
DO $$
DECLARE
    track_count INTEGER;
    playlist_count INTEGER;
    error_msg TEXT;
BEGIN
    -- Test tracks access
    BEGIN
        SELECT COUNT(*) INTO track_count FROM tracks;
        RAISE NOTICE 'Tracks query SUCCESS: % tracks accessible', track_count;
    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            RAISE NOTICE 'Tracks query FAILED: %', error_msg;
    END;
    
    -- Test playlists access
    BEGIN
        SELECT COUNT(*) INTO playlist_count FROM playlists;
        RAISE NOTICE 'Playlists query SUCCESS: % playlists accessible', playlist_count;
    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            RAISE NOTICE 'Playlists query FAILED: %', error_msg;
    END;
    
    -- Test playlist_shares access
    BEGIN
        PERFORM COUNT(*) FROM playlist_shares;
        RAISE NOTICE 'Playlist_shares query SUCCESS';
    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            RAISE NOTICE 'Playlist_shares query FAILED: %', error_msg;
    END;
END $$;

-- =====================================================
-- 4. CHECK SPECIFIC POLICY ISSUES
-- =====================================================
SELECT '=== POLICY EVALUATION ===' as section;

-- Check if the email-based policies might be failing
WITH policy_check AS (
    SELECT 
        auth.jwt()->>'email' as jwt_email,
        EXISTS (
            SELECT 1 FROM playlist_shares 
            WHERE shared_with_email = auth.jwt()->>'email'
        ) as has_shares_with_email
)
SELECT 
    CASE 
        WHEN jwt_email IS NULL THEN 'ERROR: JWT does not contain email claim'
        WHEN NOT has_shares_with_email THEN 'WARNING: No shares found for user email'
        ELSE 'OK: Email claim exists and has potential shares'
    END as email_policy_status,
    jwt_email
FROM policy_check;

-- =====================================================
-- 5. CHECK DATA EXISTENCE
-- =====================================================
SELECT '=== DATA CHECK ===' as section;

-- Check if tables have any data at all
SELECT 
    'tracks' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT user_id) as unique_users
FROM tracks
UNION ALL
SELECT 
    'playlists',
    COUNT(*),
    COUNT(DISTINCT user_id)
FROM playlists
UNION ALL
SELECT 
    'playlist_shares',
    COUNT(*),
    COUNT(DISTINCT shared_by)
FROM playlist_shares;

-- =====================================================
-- 6. EXPLAIN PLAN FOR PROBLEMATIC QUERIES
-- =====================================================
SELECT '=== QUERY PLANS ===' as section;

-- Check the execution plan for a simple tracks query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS, WAL, TIMING)
SELECT id, name 
FROM tracks 
LIMIT 1;

-- =====================================================
-- 7. CHECK FOR INFINITE LOOPS
-- =====================================================
SELECT '=== RECURSION CHECK ===' as section;

-- Look for any currently running queries that might be stuck
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    state,
    substring(query, 1, 100) as query_preview
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state = 'active'
AND pid != pg_backend_pid();

-- =====================================================
-- 8. RLS BYPASS TEST
-- =====================================================
SELECT '=== RLS BYPASS TEST ===' as section;

-- Create a temporary security definer function to bypass RLS
CREATE OR REPLACE FUNCTION temp_check_data_exists()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    sample_user_id uuid
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 'tracks'::text, COUNT(*), MIN(user_id) FROM tracks
    UNION ALL
    SELECT 'playlists'::text, COUNT(*), MIN(user_id) FROM playlists;
END;
$$ LANGUAGE plpgsql;

-- Check what data actually exists
SELECT * FROM temp_check_data_exists();

-- Clean up
DROP FUNCTION temp_check_data_exists();

-- =====================================================
-- 9. FINAL DIAGNOSIS
-- =====================================================
SELECT '=== DIAGNOSIS SUMMARY ===' as section;

SELECT 
    CASE
        WHEN auth.uid() IS NULL THEN 'CRITICAL: Not authenticated'
        WHEN auth.jwt()->>'email' IS NULL THEN 'ERROR: JWT missing email claim'
        ELSE 'Auth OK'
    END as auth_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracks') THEN 'Policies exist'
        ELSE 'ERROR: No policies found'
    END as policy_status,
    'Check NOTICE messages above for query test results' as query_test_results;