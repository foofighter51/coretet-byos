-- MAKE BUCKET PUBLIC TEMPORARILY
-- This will help determine if it's an auth/policy issue

-- 1. Make the audio-files bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio-files';

-- 2. Verify the change
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE id = 'audio-files';

-- 3. Now files should be accessible via public URL
-- The app will need to use getPublicUrl instead of createSignedUrl

SELECT '✅ Bucket is now public. Test the app again.' as status;