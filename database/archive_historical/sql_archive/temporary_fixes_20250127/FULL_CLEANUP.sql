-- FULL CLEANUP
-- Remove all tracks without files and clean up storage

-- 1. Delete playlist entries for tracks without files
DELETE FROM playlist_tracks
WHERE track_id IN (
    SELECT t.id
    FROM tracks t
    WHERE NOT EXISTS (
        SELECT 1 
        FROM storage.objects 
        WHERE bucket_id = 'audio-files' 
        AND name = t.storage_path
    )
);

-- 2. Delete tracks without files
DELETE FROM tracks
WHERE NOT EXISTS (
    SELECT 1 
    FROM storage.objects 
    WHERE bucket_id = 'audio-files' 
    AND name = storage_path
);

-- 3. Check if audio-tracks bucket exists and has files
SELECT 
    'Files in audio-tracks bucket' as description,
    COUNT(*) as count
FROM storage.objects
WHERE bucket_id = 'audio-tracks';

-- 4. Delete all files from audio-tracks bucket (if any)
DELETE FROM storage.objects
WHERE bucket_id = 'audio-tracks';

-- 5. Delete the audio-tracks bucket itself (if it exists)
DELETE FROM storage.buckets
WHERE id = 'audio-tracks';

-- 6. Final verification
SELECT 
    'Tracks in database' as item,
    COUNT(*) as count
FROM tracks
UNION ALL
SELECT 
    'Files in audio-files bucket' as item,
    COUNT(*) as count
FROM storage.objects
WHERE bucket_id = 'audio-files'
UNION ALL
SELECT 
    'Buckets remaining' as item,
    COUNT(*) as count
FROM storage.buckets;

-- Success
SELECT '✅ Cleanup complete! Database and storage are now in sync.' as status;