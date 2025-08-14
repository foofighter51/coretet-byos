-- Part 1: Add missing columns to tracks table
-- Run this first

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS tempo INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS time_signature TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('tempo', 'key', 'time_signature', 'genre', 'mood', 'notes')
ORDER BY column_name;