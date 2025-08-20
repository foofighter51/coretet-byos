-- Check current constraint definition
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'tracks_category_check';

-- Drop the existing constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_category_check;

-- Add the updated constraint with all categories from the TypeScript type
ALTER TABLE tracks ADD CONSTRAINT tracks_category_check 
CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos', 'final-versions', 'live-performances'));

-- Verify the constraint was updated
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'tracks_category_check';