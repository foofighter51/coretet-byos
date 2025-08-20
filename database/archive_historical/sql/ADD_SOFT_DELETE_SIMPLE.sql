-- Simple soft delete setup - just add the column
-- Run this in Supabase SQL Editor

-- Add deleted_at column to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Verify it was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks' 
AND column_name = 'deleted_at';