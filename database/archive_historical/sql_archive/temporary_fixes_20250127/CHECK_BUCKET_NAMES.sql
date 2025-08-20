-- CHECK BUCKET NAMES
-- Find out what buckets exist and where the files actually are

-- 1. List ALL storage buckets
SELECT 
    id,
    name,
    public,
    file_size_limit,
    created_at
FROM storage.buckets
ORDER BY created_at;

-- 2. Count files in each bucket
SELECT 
    bucket_id,
    COUNT(*) as file_count
FROM storage.objects
GROUP BY bucket_id
ORDER BY file_count DESC;

-- 3. Check if files exist in audio-tracks bucket
SELECT 
    name,
    bucket_id,
    created_at
FROM storage.objects
WHERE bucket_id = 'audio-tracks'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Compare file names between tracks table and audio-tracks bucket
WITH track_files AS (
    SELECT 
        t.id,
        t.user_id,
        t.name,
        t.file_name,
        t.storage_path
    FROM tracks t
    LIMIT 10
)
SELECT 
    tf.*,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.objects 
            WHERE bucket_id = 'audio-tracks' 
            AND (name = tf.storage_path OR name LIKE '%' || tf.file_name)
        ) THEN 'Found in audio-tracks'
        WHEN EXISTS (
            SELECT 1 FROM storage.objects 
            WHERE bucket_id = 'audio-files' 
            AND name = tf.storage_path
        ) THEN 'Found in audio-files'
        ELSE 'Not found'
    END as file_location
FROM track_files tf;