-- COMPREHENSIVE SYSTEM DIAGNOSTIC
-- Run this entire script to identify all issues

-- =====================================================
-- SECTION 1: DATABASE SCHEMA ANALYSIS
-- =====================================================

SELECT '======== DATABASE SCHEMA ========' as section;

-- 1.1 Check all tables and their RLS status
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 1.2 Check columns for key tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares', 'collaborators')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- SECTION 2: RLS POLICIES AUDIT
-- =====================================================

SELECT '======== RLS POLICIES ========' as section;

-- 2.1 All policies on core tables
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2.2 Check for policy conflicts or complexity
SELECT 
    tablename,
    COUNT(*) as policy_count,
    COUNT(DISTINCT cmd) as unique_commands,
    MAX(length(qual::text)) as max_qual_length,
    MAX(length(with_check::text)) as max_check_length
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- =====================================================
-- SECTION 3: AUTHENTICATION TEST
-- =====================================================

SELECT '======== AUTHENTICATION ========' as section;

-- 3.1 Current auth status
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED'
        ELSE 'AUTHENTICATED'
    END as auth_status,
    auth.uid() as user_id,
    auth.jwt()->>'email' as email,
    auth.jwt()->>'role' as role;

-- 3.2 User data check
SELECT 
    'User exists in auth.users' as check_type,
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid()) as result;

-- =====================================================
-- SECTION 4: DATA INTEGRITY CHECK
-- =====================================================

SELECT '======== DATA INTEGRITY ========' as section;

-- 4.1 Check for orphaned records
SELECT 
    'Orphaned playlist_tracks' as issue,
    COUNT(*) as count
FROM playlist_tracks pt
WHERE NOT EXISTS (SELECT 1 FROM playlists p WHERE p.id = pt.playlist_id)
   OR NOT EXISTS (SELECT 1 FROM tracks t WHERE t.id = pt.track_id);

-- 4.2 Check for missing user references
SELECT 
    'Tracks with invalid user_id' as issue,
    COUNT(*) as count
FROM tracks t
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = t.user_id);

-- =====================================================
-- SECTION 5: STORAGE ANALYSIS
-- =====================================================

SELECT '======== STORAGE CONFIGURATION ========' as section;

-- 5.1 Storage buckets
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 5.2 Storage usage
SELECT 
    bucket_id,
    COUNT(*) as file_count,
    SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects
GROUP BY bucket_id;

-- 5.3 Sample storage paths vs track paths
WITH track_sample AS (
    SELECT id, name, file_name, storage_path
    FROM tracks
    WHERE storage_path IS NOT NULL
    LIMIT 5
)
SELECT 
    t.name as track_name,
    t.storage_path as track_storage_path,
    s.name as storage_object_name,
    CASE 
        WHEN s.name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as file_status
FROM track_sample t
LEFT JOIN storage.objects s 
    ON s.name = t.storage_path 
    AND s.bucket_id = 'audio-files';

-- =====================================================
-- SECTION 6: RECENT CHANGES ANALYSIS
-- =====================================================

SELECT '======== RECENT MIGRATIONS ========' as section;

-- 6.1 Check for collaborator system tables
SELECT 
    'Collaborator system installed' as feature,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaborators') as present;

-- 6.2 Check for mobile-specific features
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%mobile%' OR column_name LIKE '%collaborator%'
ORDER BY table_name;

-- =====================================================
-- SECTION 7: PERFORMANCE ISSUES
-- =====================================================

SELECT '======== PERFORMANCE CHECK ========' as section;

-- 7.1 Check for slow queries
SELECT 
    calls,
    total_time,
    mean_time,
    query
FROM pg_stat_statements
WHERE mean_time > 1000 -- queries taking more than 1 second
ORDER BY mean_time DESC
LIMIT 5;

-- 7.2 Check table sizes
SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    n_tup_ins as rows_inserted,
    n_tup_upd as rows_updated,
    n_tup_del as rows_deleted
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;

-- =====================================================
-- SECTION 8: ERROR PATTERNS
-- =====================================================

SELECT '======== COMMON ERRORS ========' as section;

-- 8.1 Test basic queries for errors
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Test 1: Basic track access
    BEGIN
        PERFORM COUNT(*) FROM tracks;
        RAISE NOTICE 'TEST PASSED: Track access works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST FAILED: Track access - %', SQLERRM;
    END;
    
    -- Test 2: Playlist access
    BEGIN
        PERFORM COUNT(*) FROM playlists;
        RAISE NOTICE 'TEST PASSED: Playlist access works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST FAILED: Playlist access - %', SQLERRM;
    END;
    
    -- Test 3: Storage access
    BEGIN
        PERFORM COUNT(*) FROM storage.objects WHERE bucket_id = 'audio-files';
        RAISE NOTICE 'TEST PASSED: Storage access works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST FAILED: Storage access - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- SECTION 9: RECOMMENDATIONS
-- =====================================================

SELECT '======== ANALYSIS COMPLETE ========' as section;

SELECT 
    'Run the FULL_SYSTEM_REPORT.md for detailed findings and fixes' as next_step;