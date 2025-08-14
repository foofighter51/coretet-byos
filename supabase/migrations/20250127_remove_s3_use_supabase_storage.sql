-- Migration: Remove S3 references and standardize on Supabase Storage
-- This migration cleanly transitions from s3_key to storage_path

-- Step 1: Add storage_path column if it doesn't exist
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Step 2: Copy data from s3_key to storage_path if needed
UPDATE tracks
SET storage_path = s3_key
WHERE storage_path IS NULL 
AND s3_key IS NOT NULL;

-- Step 3: Drop s3_key column after data migration
ALTER TABLE tracks 
DROP COLUMN IF EXISTS s3_key;

-- Step 4: Add index on storage_path for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_storage_path 
ON tracks(storage_path);

-- Step 5: Update any NULL storage_paths to proper format
-- This handles tracks that might have been created without proper paths
UPDATE tracks
SET storage_path = user_id || '/' || id || '/' || file_name
WHERE storage_path IS NULL
AND file_name IS NOT NULL;

-- Step 6: Add NOT NULL constraint to storage_path
-- Only do this after ensuring all tracks have paths
DO $$
BEGIN
    -- Check if any NULL storage_paths remain
    IF NOT EXISTS (SELECT 1 FROM tracks WHERE storage_path IS NULL) THEN
        ALTER TABLE tracks 
        ALTER COLUMN storage_path SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to storage_path';
    ELSE
        RAISE NOTICE 'Some tracks still have NULL storage_path - constraint not added';
    END IF;
END $$;

-- Step 7: Update categories to include new options
ALTER TABLE tracks 
DROP CONSTRAINT IF EXISTS tracks_category_check;

ALTER TABLE tracks 
ADD CONSTRAINT tracks_category_check 
CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos', 'final-versions', 'live-performances'));

-- Step 8: Log migration completion
INSERT INTO migration_log (migration_name, applied_at)
VALUES ('remove_s3_use_supabase_storage', NOW())
ON CONFLICT (migration_name) DO NOTHING;