-- CLEANUP MISSING TRACKS
-- Remove tracks that don't have corresponding audio files

-- 1. First, let's see what will be removed
WITH missing_tracks AS (
    SELECT t.*
    FROM tracks t
    WHERE NOT EXISTS (
        SELECT 1 
        FROM storage.objects 
        WHERE bucket_id = 'audio-files' 
        AND name = t.storage_path
    )
)
SELECT 
    COUNT(*) as tracks_to_remove,
    array_agg(name ORDER BY created_at DESC LIMIT 10) as sample_track_names
FROM missing_tracks;

-- 2. Create a backup table before deletion (optional)
CREATE TABLE IF NOT EXISTS tracks_backup_20250127 AS 
SELECT * FROM tracks;

-- 3. Delete tracks without audio files
WITH missing_tracks AS (
    SELECT t.id
    FROM tracks t
    WHERE NOT EXISTS (
        SELECT 1 
        FROM storage.objects 
        WHERE bucket_id = 'audio-files' 
        AND name = t.storage_path
    )
)
DELETE FROM playlist_tracks
WHERE track_id IN (SELECT id FROM missing_tracks);

-- 4. Now delete the tracks themselves
DELETE FROM tracks t
WHERE NOT EXISTS (
    SELECT 1 
    FROM storage.objects 
    WHERE bucket_id = 'audio-files' 
    AND name = t.storage_path
)
RETURNING id, name, file_name;

-- 5. Verify cleanup
SELECT 
    'Tracks remaining' as status,
    COUNT(*) as count
FROM tracks
UNION ALL
SELECT 
    'Files in storage' as status,
    COUNT(*) as count
FROM storage.objects
WHERE bucket_id = 'audio-files';

-- 6. Clean up any orphaned playlist entries
DELETE FROM playlist_tracks pt
WHERE NOT EXISTS (
    SELECT 1 FROM tracks t WHERE t.id = pt.track_id
);

-- Success message
SELECT '✅ Cleanup complete! All tracks now have corresponding audio files.' as message;