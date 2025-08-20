-- QUICK FIX FOR COLUMN NAMING
-- Run this to make the database match the frontend

-- 1. Add default for share_status first
ALTER TABLE playlist_shares 
ALTER COLUMN share_status SET DEFAULT 'pending';

-- 2. Rename share_status to status
ALTER TABLE playlist_shares 
RENAME COLUMN share_status TO status;

-- 3. Add invited_at column with default
ALTER TABLE playlist_shares 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Update any existing values
UPDATE playlist_shares 
SET invited_at = COALESCE(created_at, NOW())
WHERE invited_at IS NULL;

-- 5. Verify the changes
SELECT 
    'Column Check' as result,
    column_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'playlist_shares'
ORDER BY ordinal_position;

-- 6. Test that sharing works now
-- Try sharing from the UI again after running this