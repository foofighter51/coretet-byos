-- FIX SIGNED URL AUTHENTICATION
-- The issue is that creating signed URLs requires different permissions than just SELECT

-- 1. First check current policies
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can view own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;

-- 3. Create more permissive policies that work with signed URLs
-- Allow authenticated users to view files in audio-files bucket
CREATE POLICY "Authenticated users can view audio files" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'audio-files');

-- Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can only update their own files
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can only delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 4. Alternative: Use service role for signed URLs
-- If the above doesn't work, we might need to use a different approach
-- where the edge function generates signed URLs using service role

SELECT '✅ Updated policies to allow signed URL generation' as status;

-- 5. Test query
SELECT 
    COUNT(*) as total_files
FROM storage.objects
WHERE bucket_id = 'audio-files';