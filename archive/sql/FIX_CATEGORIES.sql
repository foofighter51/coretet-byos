-- FIX CATEGORIES BEFORE APPLYING CONSTRAINT
-- Check what categories exist and fix them

-- 1. See what categories we have
SELECT DISTINCT category, COUNT(*) as count
FROM tracks
GROUP BY category
ORDER BY count DESC;

-- 2. Update any non-standard categories to 'songs'
UPDATE tracks
SET category = 'songs'
WHERE category NOT IN ('songs', 'demos', 'ideas', 'voice-memos');

-- 3. Now we can add the constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_category_check;
ALTER TABLE tracks ADD CONSTRAINT tracks_category_check 
    CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos'));

-- 4. Verify the fix
SELECT DISTINCT category, COUNT(*) as count
FROM tracks
GROUP BY category
ORDER BY count DESC;