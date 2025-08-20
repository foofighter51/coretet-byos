-- SECURE STORAGE FINAL
-- Make bucket private and ensure proper authentication

-- 1. Make the audio-files bucket private again
UPDATE storage.buckets 
SET public = false 
WHERE id = 'audio-files';

-- 2. Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;

-- 3. Create secure policies for authenticated users
-- Users can only access files in their own folder
CREATE POLICY "Users can view own audio files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload own audio files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own audio files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own audio files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'audio-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 4. Future enhancement: Add policy for shared playlists
-- This would allow users to access files from tracks in playlists shared with them
-- For now, keeping it simple with owner-only access

-- 5. Verify the changes
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE id = 'audio-files';

-- 6. Check policies are created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

SELECT '✅ Storage is now secured. Only authenticated users can access their own files.' as status;