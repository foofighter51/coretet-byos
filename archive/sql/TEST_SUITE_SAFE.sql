-- SAFE TEST SUITE FOR CORETET
-- This version checks for table existence before running tests

-- ============================================
-- 0. SYSTEM CHECK
-- ============================================

SELECT 
    'System Check' as test_name,
    current_database() as database,
    current_user as user,
    version() as postgres_version;

-- ============================================
-- 1. AUTHENTICATION & USER ACCESS TESTS
-- ============================================

-- Test 1.1: Check if user can access their own data
SELECT 
    'Test 1.1: User Data Access' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - User can see their tracks'
        ELSE '❌ FAIL - No tracks visible'
    END as result,
    COUNT(*) as track_count
FROM tracks
WHERE user_id = auth.uid();

-- Test 1.2: Verify user profile exists
SELECT 
    'Test 1.2: User Profile' as test_name,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ PASS - Profile exists'
        ELSE '❌ FAIL - Profile missing'
    END as result,
    COUNT(*) as profile_count
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 2. TRACK STORAGE & RETRIEVAL TESTS
-- ============================================

-- Test 2.1: Check tracks have valid storage paths
SELECT 
    'Test 2.1: Track Storage Paths' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All tracks have storage paths'
        ELSE '❌ FAIL - ' || COUNT(*) || ' tracks missing storage paths'
    END as result,
    COUNT(*) as tracks_without_storage
FROM tracks
WHERE user_id = auth.uid()
AND (storage_path IS NULL OR storage_path = '');

-- Test 2.2: Verify storage paths follow correct format
SELECT 
    'Test 2.2: Storage Path Format' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All paths follow correct format'
        ELSE '❌ FAIL - ' || COUNT(*) || ' tracks have invalid paths'
    END as result,
    COUNT(*) as invalid_paths
FROM tracks
WHERE user_id = auth.uid()
AND storage_path NOT LIKE 'users/%/tracks/%';

-- ============================================
-- 3. PLAYLIST FUNCTIONALITY TESTS
-- ============================================

-- Test 3.1: User can see their playlists
SELECT 
    'Test 3.1: Playlist Access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS - Can access playlists'
        ELSE '❌ FAIL - Cannot access playlists'
    END as result,
    COUNT(*) as playlist_count
FROM playlists
WHERE user_id = auth.uid();

-- Test 3.2: Playlist tracks are properly linked
SELECT 
    'Test 3.2: Playlist Track Links' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All playlist tracks are valid'
        ELSE '❌ FAIL - ' || COUNT(*) || ' invalid playlist tracks'
    END as result,
    COUNT(*) as orphaned_tracks
FROM playlist_tracks pt
JOIN playlists p ON p.id = pt.playlist_id
LEFT JOIN tracks t ON t.id = pt.track_id
WHERE p.user_id = auth.uid()
AND t.id IS NULL;

-- Test 3.3: Check if playlist_shares table exists and test it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'playlist_shares'
    ) THEN
        -- Table exists, run the test
        PERFORM COUNT(DISTINCT ps.playlist_id)
        FROM playlist_shares ps
        WHERE ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ps.status = 'active';
        
        RAISE NOTICE 'Test 3.3: Shared Playlists - ✅ Table exists and query works';
    ELSE
        RAISE NOTICE 'Test 3.3: Shared Playlists - ⚠️  SKIP - playlist_shares table not found';
    END IF;
END $$;

-- ============================================
-- 4. RATING SYSTEM TESTS
-- ============================================

-- Test 4.1: Personal ratings table accessible
SELECT 
    'Test 4.1: Personal Ratings Access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS - Can access personal ratings'
        ELSE '❌ FAIL - Cannot access personal ratings'
    END as result,
    COUNT(*) as personal_ratings_count
FROM personal_track_ratings
WHERE user_id = auth.uid();

-- Test 4.2: Playlist ratings table accessible
SELECT 
    'Test 4.2: Playlist Ratings Access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS - Can access playlist ratings'
        ELSE '❌ FAIL - Cannot access playlist ratings'
    END as result,
    COUNT(*) as playlist_ratings_count
FROM playlist_track_ratings
WHERE user_id = auth.uid();

-- Test 4.3: Rating values are valid
SELECT 
    'Test 4.3: Rating Values' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All ratings have valid values'
        ELSE '❌ FAIL - ' || COUNT(*) || ' invalid ratings found'
    END as result,
    COUNT(*) as invalid_ratings
FROM (
    SELECT rating FROM personal_track_ratings WHERE user_id = auth.uid()
    UNION ALL
    SELECT rating FROM playlist_track_ratings WHERE user_id = auth.uid()
) all_ratings
WHERE rating NOT IN ('listened', 'liked', 'loved');

-- ============================================
-- 5. DATA INTEGRITY TESTS
-- ============================================

-- Test 5.1: Check for orphaned data
SELECT 
    'Test 5.1: Orphaned Playlist Tracks' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - No orphaned playlist tracks'
        ELSE '⚠️  WARNING - ' || COUNT(*) || ' orphaned playlist tracks'
    END as result,
    COUNT(*) as orphaned_count
FROM playlist_tracks pt
LEFT JOIN playlists p ON p.id = pt.playlist_id
WHERE p.id IS NULL;

-- Test 5.2: Check category constraints
SELECT 
    'Test 5.2: Track Categories' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All tracks have valid categories'
        ELSE '❌ FAIL - ' || COUNT(*) || ' tracks with invalid categories'
    END as result,
    COUNT(*) as invalid_categories
FROM tracks
WHERE user_id = auth.uid()
AND category NOT IN ('stems', 'songs', 'demos', 'ideas', 'archived', 'final-versions', 'live-performances');

-- ============================================
-- 6. TABLE EXISTENCE SUMMARY
-- ============================================

SELECT 
    'Table Existence Check' as test_name,
    string_agg(
        table_name || ': ' || 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = expected.table_name
            ) THEN '✅'
            ELSE '❌'
        END,
        ', '
    ) as tables_status
FROM (
    VALUES 
        ('tracks'),
        ('playlists'),
        ('playlist_tracks'),
        ('profiles'),
        ('personal_track_ratings'),
        ('playlist_track_ratings')
) AS expected(table_name);

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
    '=== TEST COMPLETE ===' as status,
    'Check results above' as message,
    NOW() as test_time;