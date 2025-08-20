-- SIMPLE STORAGE CHECK
-- Basic diagnostics for audio file issues

-- =====================================================
-- 1. CHECK STORAGE BUCKET
-- =====================================================
SELECT '=== STORAGE BUCKET CHECK ===' as section;

SELECT 
    id,
    name,
    public
FROM storage.buckets
WHERE name = 'audio-files';

-- =====================================================
-- 2. CHECK TRACKS TABLE
-- =====================================================
SELECT '=== TRACKS TABLE CHECK ===' as section;

-- Show columns related to file storage
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tracks'
AND column_name IN ('id', 'name', 'file_name', 'storage_path', 'url', 'file_path', 's3_key')
ORDER BY column_name;

-- =====================================================
-- 3. SAMPLE YOUR TRACKS
-- =====================================================
SELECT '=== YOUR TRACKS ===' as section;

-- Show first 5 tracks with all storage-related fields
SELECT 
    id,
    name,
    file_name,
    storage_path,
    created_at
FROM tracks
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 4. CHECK STORAGE_PATH VALUES
-- =====================================================
SELECT '=== STORAGE PATH ANALYSIS ===' as section;

-- Analyze storage_path format
SELECT 
    COUNT(*) as total_tracks,
    COUNT(storage_path) as has_storage_path,
    COUNT(CASE WHEN storage_path IS NULL THEN 1 END) as missing_storage_path,
    COUNT(CASE WHEN storage_path LIKE '%/%' THEN 1 END) as has_folder_structure
FROM tracks
WHERE user_id = auth.uid();

-- Show different storage_path patterns
SELECT DISTINCT
    CASE 
        WHEN storage_path IS NULL THEN 'NULL'
        WHEN storage_path LIKE '%/%/%' THEN 'user_id/track_id/filename'
        WHEN storage_path LIKE '%/%' THEN 'folder/filename'
        ELSE 'just_filename'
    END as path_pattern,
    COUNT(*) as count
FROM tracks
WHERE user_id = auth.uid()
GROUP BY path_pattern;

-- =====================================================
-- 5. CHECK FILES IN STORAGE
-- =====================================================
SELECT '=== STORAGE FILES CHECK ===' as section;

-- Try to count files (this might fail if no access)
DO $$
BEGIN
    PERFORM COUNT(*) FROM storage.objects WHERE bucket_id = 'audio-files';
    RAISE NOTICE 'Storage.objects table is accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Cannot access storage.objects table: %', SQLERRM;
END $$;

-- =====================================================
-- 6. CHECK RLS ON STORAGE.OBJECTS
-- =====================================================
SELECT '=== STORAGE RLS CHECK ===' as section;

-- Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- Check policies on storage.objects
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND qual LIKE '%audio-files%'
ORDER BY policyname;

-- =====================================================
-- 7. QUICK FIX ATTEMPT
-- =====================================================
SELECT '=== ATTEMPTING QUICK FIX ===' as section;

-- If storage_path is NULL but we have file_name, create a path
UPDATE tracks
SET storage_path = user_id || '/' || id || '/' || file_name
WHERE user_id = auth.uid()
AND storage_path IS NULL
AND file_name IS NOT NULL
RETURNING id, name, storage_path;

-- =====================================================
-- 8. FINAL RECOMMENDATIONS
-- =====================================================
SELECT '=== RECOMMENDATIONS ===' as section;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'audio-files') 
        THEN '✓ audio-files bucket exists'
        ELSE '✗ audio-files bucket missing - create it!'
    END as bucket_status,
    
    CASE
        WHEN EXISTS (SELECT 1 FROM tracks WHERE user_id = auth.uid() AND storage_path IS NOT NULL)
        THEN '✓ Tracks have storage_path values'
        ELSE '✗ Tracks missing storage_path - need to update!'
    END as path_status;