-- Run metadata columns migration
-- This adds the missing metadata columns to the tracks table

-- First check if columns already exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks' 
AND column_name IN ('tempo', 'key', 'mood', 'genre', 'notes', 'time_signature')
ORDER BY column_name;

-- Add metadata columns if they don't exist
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS tempo INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS time_signature TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks' 
AND column_name IN ('tempo', 'key', 'mood', 'genre', 'notes', 'time_signature')
ORDER BY column_name;

-- Test update on a track (replace with actual track ID)
-- UPDATE tracks 
-- SET tempo = 120, 
--     key = 'C Major',
--     time_signature = '4/4'
-- WHERE id = 'your-track-id-here'
-- RETURNING id, name, tempo, key, time_signature;