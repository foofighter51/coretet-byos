-- DEBUG SIGNED URL ISSUES
-- Check if the current user can access their files

-- 1. Check current auth user
SELECT auth.uid() as current_user_id;

-- 2. Check bucket configuration
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE id = 'audio-files';

-- 3. Check storage policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- 4. Test if user can see their own files
SELECT 
    COUNT(*) as files_user_can_see,
    auth.uid() as user_id
FROM storage.objects
WHERE bucket_id = 'audio-files'
AND auth.uid()::text = (storage.foldername(name))[1];

-- 5. Check a specific file
SELECT 
    name,
    bucket_id,
    (storage.foldername(name))[1] as file_owner_id,
    auth.uid()::text as current_user_id,
    auth.uid()::text = (storage.foldername(name))[1] as can_access
FROM storage.objects
WHERE bucket_id = 'audio-files'
AND name LIKE '%3ad6d3c6-fd1a-4340-b6f8-bb4d7699a190%';

-- 6. Test if service role can create signed URLs
-- This simulates what the client should be able to do
SELECT 
    'Check if authenticated users have proper permissions' as check_note;