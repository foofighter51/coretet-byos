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

-- 3. Check storage policies
SELECT 
    name,
    definition,
    action
FROM storage.policies
WHERE bucket_id = 'audio-files';

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

-- 5. Test creating a signed URL manually
-- This will help identify if it's a permission issue
SELECT 
    storage.extension('audio-files/' || storage_path) as file_extension,
    storage_path
FROM tracks
WHERE storage_path IS NOT NULL
LIMIT 1;