-- DIAGNOSE STORAGE ISSUES
-- This helps understand why audio files aren't playing

-- =====================================================
-- 1. CHECK STORAGE BUCKET
-- =====================================================
SELECT '=== STORAGE BUCKET STATUS ===' as section;

SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'audio-files';

-- =====================================================
-- 2. CHECK EXISTING STORAGE POLICIES
-- =====================================================
SELECT '=== CURRENT STORAGE POLICIES ===' as section;

SELECT 
    name as policy_name,
    action,
    definition
FROM storage.policies
WHERE bucket_id = 'audio-files'
ORDER BY name;

-- =====================================================
-- 3. CHECK TRACKS TABLE STRUCTURE
-- =====================================================
SELECT '=== TRACKS TABLE COLUMNS ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tracks'
ORDER BY ordinal_position;

-- =====================================================
-- 4. SAMPLE TRACK DATA
-- =====================================================
SELECT '=== SAMPLE TRACKS ===' as section;

-- Check how tracks are storing file references
SELECT 
    id,
    name,
    file_name,
    storage_path,
    created_at
FROM tracks
WHERE user_id = auth.uid()
LIMIT 5;

-- =====================================================
-- 5. CHECK IF FILES EXIST IN STORAGE
-- =====================================================
SELECT '=== FILES IN STORAGE ===' as section;

-- Count files in storage for current user
SELECT 
    COUNT(*) as file_count,
    MIN(created_at) as oldest_file,
    MAX(created_at) as newest_file
FROM storage.objects
WHERE bucket_id = 'audio-files'
AND owner = auth.uid();

-- Sample some files
SELECT 
    name,
    metadata,
    created_at
FROM storage.objects
WHERE bucket_id = 'audio-files'
AND owner = auth.uid()
LIMIT 5;

-- =====================================================
-- 6. MATCH TRACKS TO STORAGE FILES
-- =====================================================
SELECT '=== TRACK-STORAGE ALIGNMENT ===' as section;

-- Check if track storage_paths match actual files
WITH track_paths AS (
    SELECT 
        id,
        name,
        storage_path,
        user_id
    FROM tracks
    WHERE user_id = auth.uid()
    AND storage_path IS NOT NULL
    LIMIT 10
)
SELECT 
    t.name as track_name,
    t.storage_path,
    CASE 
        WHEN s.name IS NOT NULL THEN 'File exists'
        ELSE 'File missing'
    END as storage_status
FROM track_paths t
LEFT JOIN storage.objects s 
    ON s.name = t.storage_path 
    AND s.bucket_id = 'audio-files';

-- =====================================================
-- 7. COMMON ISSUES CHECK
-- =====================================================
SELECT '=== COMMON ISSUES ===' as section;

-- Check for path format issues
SELECT 
    'Path format analysis' as check_type,
    COUNT(*) as total_tracks,
    COUNT(CASE WHEN storage_path IS NULL THEN 1 END) as null_paths,
    COUNT(CASE WHEN storage_path LIKE '/%' THEN 1 END) as absolute_paths,
    COUNT(CASE WHEN storage_path LIKE '%/%/%' THEN 1 END) as nested_paths,
    COUNT(CASE WHEN storage_path NOT LIKE '%/%' THEN 1 END) as flat_paths
FROM tracks
WHERE user_id = auth.uid();

-- =====================================================
-- 8. RECOMMENDATIONS
-- =====================================================
SELECT '=== ANALYSIS COMPLETE ===' as section;

SELECT 
    'Check the results above for:' as recommendation,
    '1. Does audio-files bucket exist?' as check1,
    '2. Are storage policies configured?' as check2,
    '3. Does tracks table have storage_path column?' as check3,
    '4. Do tracks have storage_path values?' as check4,
    '5. Do files exist in Supabase storage?' as check5,
    '6. Do storage_paths match actual file names?' as check6;