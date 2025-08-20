-- HANDLE MISSING FILES
-- Choose ONE of these options based on your preference

-- =====================================================
-- OPTION 1: DELETE MISSING TRACKS (Permanent)
-- =====================================================
-- Uncomment this section to delete tracks without files

/*
-- First, see what will be deleted
WITH storage_files AS (
    SELECT name FROM storage.objects WHERE bucket_id = 'audio-files'
)
SELECT 
    t.id,
    t.name,
    t.file_name,
    t.created_at
FROM tracks t
LEFT JOIN storage_files sf ON sf.name = t.storage_path
WHERE sf.name IS NULL;

-- Then delete them
WITH storage_files AS (
    SELECT name FROM storage.objects WHERE bucket_id = 'audio-files'
)
DELETE FROM tracks t
USING (
    SELECT t2.id 
    FROM tracks t2
    LEFT JOIN storage_files sf ON sf.name = t2.storage_path
    WHERE sf.name IS NULL
) AS missing
WHERE t.id = missing.id
RETURNING t.id, t.name;
*/

-- =====================================================
-- OPTION 2: MARK AS ARCHIVED (Reversible)
-- =====================================================
-- Uncomment this section to hide missing tracks

/*
-- Add archived column if it doesn't exist
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Archive tracks without files
WITH storage_files AS (
    SELECT name FROM storage.objects WHERE bucket_id = 'audio-files'
)
UPDATE tracks t
SET archived = true
FROM (
    SELECT t2.id 
    FROM tracks t2
    LEFT JOIN storage_files sf ON sf.name = t2.storage_path
    WHERE sf.name IS NULL
) AS missing
WHERE t.id = missing.id
RETURNING t.id, t.name;

-- Update UI queries to exclude archived tracks:
-- Add "AND archived = false" to your queries
*/

-- =====================================================
-- OPTION 3: FIX STORAGE PATHS
-- =====================================================
-- If files exist but paths are wrong, try this

-- Check if files exist with different path formats
SELECT 
    t.id,
    t.storage_path as current_path,
    t.user_id || '/' || t.id || '/' || t.file_name as expected_path,
    EXISTS (
        SELECT 1 FROM storage.objects 
        WHERE bucket_id = 'audio-files' 
        AND name = t.user_id || '/' || t.id || '/' || t.file_name
    ) as file_exists_at_expected_path
FROM tracks t
WHERE t.storage_path IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'audio-files' 
    AND name = t.storage_path
)
LIMIT 20;

-- =====================================================
-- QUICK FIX: Just get the app working
-- =====================================================
-- This query gives you all tracks that DO have files
-- You can use this to filter in your app temporarily

CREATE OR REPLACE VIEW available_tracks AS
SELECT t.*
FROM tracks t
WHERE EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'audio-files' 
    AND name = t.storage_path
);