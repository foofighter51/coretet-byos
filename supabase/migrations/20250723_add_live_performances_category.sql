-- Update the CHECK constraint to include 'live-performances'
-- This migration updates the tracks table to allow the new category

-- First, drop the existing CHECK constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_category_check;

-- Add the updated CHECK constraint with 'live-performances'
ALTER TABLE tracks ADD CONSTRAINT tracks_category_check 
CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos', 'final-versions', 'live-performances'));