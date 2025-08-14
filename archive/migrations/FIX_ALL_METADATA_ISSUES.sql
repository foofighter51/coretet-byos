-- =====================================================
-- FIX ALL METADATA ISSUES
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- 1. Check current category constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS current_constraint_definition
FROM pg_constraint
WHERE conname = 'tracks_category_check';

-- 2. Drop the existing constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_category_check;

-- 3. Add the updated constraint with all categories
ALTER TABLE tracks ADD CONSTRAINT tracks_category_check 
CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos', 'final-versions', 'live-performances'));

-- 4. Verify the constraint was updated
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS new_constraint_definition
FROM pg_constraint
WHERE conname = 'tracks_category_check';

-- 5. Ensure all metadata columns exist
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS tempo INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS time_signature TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Verify all columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks' 
AND column_name IN ('tempo', 'key', 'mood', 'genre', 'notes', 'time_signature', 'category')
ORDER BY column_name;

-- 7. Test that updates work (optional - uncomment and replace with actual track ID)
-- UPDATE tracks 
-- SET 
--     category = 'final-versions',
--     tempo = 120,
--     key = 'C Major',
--     time_signature = '4/4'
-- WHERE id = 'YOUR-TRACK-ID-HERE'
--   AND user_id = auth.uid()
-- RETURNING id, name, category, tempo, key, time_signature;