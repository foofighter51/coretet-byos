-- MAKE BUCKET PUBLIC NOW
-- The bucket is still private, causing 400 errors

-- 1. Check current bucket status
SELECT 
    id,
    name,
    public,
    CASE 
        WHEN public = true THEN '✅ Bucket is PUBLIC'
        ELSE '❌ Bucket is PRIVATE - This is why audio fails!'
    END as status
FROM storage.buckets
WHERE id = 'audio-files';

-- 2. Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio-files';

-- 3. Verify the change
SELECT 
    id,
    name,
    public,
    CASE 
        WHEN public = true THEN '✅ Bucket is now PUBLIC - Audio will work!'
        ELSE '❌ Still private - something went wrong'
    END as status
FROM storage.buckets
WHERE id = 'audio-files';

-- 4. Test - try this URL in your browser after running this:
-- https://chynnmeidbcqsnswlxmt.supabase.co/storage/v1/object/public/audio-files/55a58df9-3698-4973-9add-b82d76cde766/2ab4bd7f-112d-4160-8caf-868182926634/ThursdayPlayground_190910_v2.mp3

SELECT '✅ Bucket is now public. Refresh your app and audio should play!' as message;