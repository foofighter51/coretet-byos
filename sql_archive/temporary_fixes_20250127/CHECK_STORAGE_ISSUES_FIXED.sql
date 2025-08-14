-- CHECK STORAGE ISSUES
-- Diagnose why files can't be accessed

-- 1. Check sample tracks and their storage paths
SELECT 
    id,
    user_id,
    name,
    file_name,
    storage_path,
    created_at
FROM tracks
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if audio-files bucket exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'audio-files';

-- 3. Check storage RLS policies on objects table
SELECT 
    policyname,
    tablename,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

-- 4. Check if files actually exist in storage
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'audio-files'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check a specific track that's failing
-- Using the track ID from your error: 1fe54508-17a5-42e9-9a03-d67bd25398a2
SELECT 
    id,
    user_id,
    name,
    file_name,
    storage_path
FROM tracks
WHERE id = '1fe54508-17a5-42e9-9a03-d67bd25398a2';

-- 6. Count files in storage vs database
SELECT 
    'Tracks in database' as description,
    COUNT(*) as count
FROM tracks
WHERE storage_path IS NOT NULL
UNION ALL
SELECT 
    'Files in storage' as description,
    COUNT(*) as count
FROM storage.objects
WHERE bucket_id = 'audio-files';