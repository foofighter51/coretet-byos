-- FIND MISSING FILES
-- Identify tracks that don't have corresponding files in Supabase Storage

-- 1. Find tracks without files in storage
WITH storage_files AS (
    SELECT 
        name,
        bucket_id
    FROM storage.objects
    WHERE bucket_id = 'audio-files'
)
SELECT 
    t.id,
    t.user_id,
    t.name,
    t.file_name,
    t.storage_path,
    t.created_at,
    CASE 
        WHEN sf.name IS NULL THEN 'MISSING'
        ELSE 'EXISTS'
    END as storage_status
FROM tracks t
LEFT JOIN storage_files sf ON sf.name = t.storage_path
ORDER BY storage_status DESC, t.created_at DESC;

-- 2. Summary of missing files by user
WITH storage_files AS (
    SELECT 
        name,
        bucket_id
    FROM storage.objects
    WHERE bucket_id = 'audio-files'
)
SELECT 
    t.user_id,
    COUNT(*) as total_tracks,
    COUNT(sf.name) as tracks_with_files,
    COUNT(*) - COUNT(sf.name) as missing_files
FROM tracks t
LEFT JOIN storage_files sf ON sf.name = t.storage_path
GROUP BY t.user_id
HAVING COUNT(*) - COUNT(sf.name) > 0;

-- 3. Check date patterns - when were missing files created?
WITH storage_files AS (
    SELECT 
        name,
        bucket_id
    FROM storage.objects
    WHERE bucket_id = 'audio-files'
)
SELECT 
    DATE(t.created_at) as created_date,
    COUNT(*) as total_tracks,
    COUNT(sf.name) as tracks_with_files,
    COUNT(*) - COUNT(sf.name) as missing_files
FROM tracks t
LEFT JOIN storage_files sf ON sf.name = t.storage_path
GROUP BY DATE(t.created_at)
ORDER BY created_date DESC;

-- 4. Options for handling missing files
SELECT 
    E'\n⚠️  MISSING FILES DETECTED\n\n' ||
    'You have tracks in the database without corresponding audio files.\n\n' ||
    'Options:\n' ||
    '1. DELETE missing tracks: Remove database records for files that don''t exist\n' ||
    '2. HIDE missing tracks: Mark them as deleted/archived\n' ||
    '3. RE-UPLOAD: If you have the original files, re-upload them\n\n' ||
    'The missing files were likely stored in S3 and not migrated to Supabase Storage.' as options;