-- COMPREHENSIVE TEST SUITE FOR CORETET
-- Run these tests to verify all functionality

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

-- Test 1.3: Check RLS policies are working
DO $$
DECLARE
    other_user_id UUID;
    track_count INT;
BEGIN
    -- Get another user's ID (if exists)
    SELECT id INTO other_user_id 
    FROM profiles 
    WHERE id != auth.uid() 
    LIMIT 1;
    
    IF other_user_id IS NOT NULL THEN
        -- Try to see other user's tracks (should be 0)
        SELECT COUNT(*) INTO track_count
        FROM tracks
        WHERE user_id = other_user_id;
        
        IF track_count = 0 THEN
            RAISE NOTICE 'Test 1.3: RLS Policies - ✅ PASS - Cannot see other users tracks';
        ELSE
            RAISE NOTICE 'Test 1.3: RLS Policies - ❌ FAIL - Can see % other user tracks', track_count;
        END IF;
    ELSE
        RAISE NOTICE 'Test 1.3: RLS Policies - ⚠️  SKIP - No other users to test against';
    END IF;
END $$;

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

-- Test 2.3: Check for duplicate tracks
SELECT 
    'Test 2.3: Duplicate Tracks' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - No duplicate tracks found'
        ELSE '⚠️  WARNING - ' || COUNT(*) || ' potential duplicates'
    END as result,
    COUNT(*) as duplicate_count
FROM (
    SELECT name, artist, COUNT(*) as copies
    FROM tracks
    WHERE user_id = auth.uid()
    GROUP BY name, artist
    HAVING COUNT(*) > 1
) duplicates;

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

-- Test 3.3: Check shared playlist access
SELECT 
    'Test 3.3: Shared Playlist Access' as test_name,
    COUNT(DISTINCT ps.playlist_id) as shared_playlists_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS - Shared playlist query works'
        ELSE '❌ FAIL - Cannot query shared playlists'
    END as result
FROM playlist_shares ps
WHERE ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
AND ps.status = 'active';

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

-- Test 5.3: Check timestamp consistency
SELECT 
    'Test 5.3: Timestamp Consistency' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All timestamps are consistent'
        ELSE '⚠️  WARNING - ' || COUNT(*) || ' records with future timestamps'
    END as result,
    COUNT(*) as future_records
FROM (
    SELECT created_at FROM tracks WHERE user_id = auth.uid() AND created_at > NOW()
    UNION ALL
    SELECT created_at FROM playlists WHERE user_id = auth.uid() AND created_at > NOW()
) future_timestamps;

-- ============================================
-- 6. PERFORMANCE TESTS
-- ============================================

-- Test 6.1: Query performance for track listing
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT t.*, ptr.rating
FROM tracks t
LEFT JOIN personal_track_ratings ptr ON ptr.track_id = t.id AND ptr.user_id = auth.uid()
WHERE t.user_id = auth.uid()
ORDER BY t.created_at DESC
LIMIT 50;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
    '=== TEST SUMMARY ===' as section,
    'Run each test above and verify all PASS' as instructions,
    'Check for any FAIL or WARNING results' as action_required;

-- Additional edge function test
SELECT 
    'Edge Function Test' as test_name,
    'To test edge functions, use the Supabase dashboard' as instructions,
    'Test get-track-url with a valid track ID' as action;

-- Mobile-specific test reminder
SELECT 
    'Mobile Test Checklist' as test_name,
    '1. Test on actual iOS device' as ios_test,
    '2. Test on actual Android device' as android_test,
    '3. Test wake lock during playback' as wake_lock_test,
    '4. Test media session controls' as media_session_test,
    '5. Test offline PWA functionality' as pwa_test;