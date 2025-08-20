-- SECURE STORAGE FINAL V2
-- Make bucket private and update storage policies

-- 1. Make bucket private again for security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'audio-files';

-- 2. Drop all existing storage policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 3. Create service-level policy that allows service role to access files
-- This enables our edge function to generate signed URLs
CREATE POLICY "Service role has full access" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'audio-files');

-- 4. Allow authenticated users to upload to their own folder only
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'audio-files' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 5. Verify changes
SELECT 
    id,
    name,
    public,
    CASE 
        WHEN public = false THEN '✅ Bucket is private - using edge function for URLs'
        ELSE '❌ Bucket is public - need to make it private'
    END as status
FROM storage.buckets
WHERE id = 'audio-files';

SELECT '✅ Storage is now secure. Edge function will handle URL generation.' as status;