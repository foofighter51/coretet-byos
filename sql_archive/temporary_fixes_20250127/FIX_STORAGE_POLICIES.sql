-- FIX STORAGE POLICIES
-- Ensure proper RLS policies for storage access

-- 1. Check current storage policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

-- 2. Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete audio" ON storage.objects;

-- 3. Create simpler, more permissive policies for testing
-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Verify the bucket configuration
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'audio-files';

-- 5. Test query to verify user can see their files
SELECT 
    COUNT(*) as visible_files
FROM storage.objects
WHERE bucket_id = 'audio-files'
AND auth.uid()::text = (storage.foldername(name))[1];

-- 6. Alternative: Make bucket temporarily public for testing
-- UPDATE storage.buckets SET public = true WHERE id = 'audio-files';

SELECT '✅ Storage policies updated. Try playing a track now.' as status;