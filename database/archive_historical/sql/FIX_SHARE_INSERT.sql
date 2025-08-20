-- FIX SHARE INSERT ISSUE
-- The UI is not including share_status in the insert

-- 1. First, let's add a default value for share_status
ALTER TABLE playlist_shares 
ALTER COLUMN share_status SET DEFAULT 'pending';

-- 2. Check current column defaults
SELECT 
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'playlist_shares'
ORDER BY ordinal_position;

-- 3. Make sure all required columns have defaults or are nullable
-- The UI is only sending: playlist_id, shared_by, shared_with_email, can_rate, can_edit

-- 4. Let's test creating a share with minimal fields (like the UI does)
-- First, get a playlist to test with
SELECT 
    'Test Playlist' as section,
    id,
    name,
    user_id
FROM playlists
WHERE user_id = auth.uid()
LIMIT 1;

-- 5. Now run the STANDARDIZE_SHARING_COLUMNS.sql to fix column naming
-- This will rename share_status to status and fix the frontend compatibility

-- 6. Alternative: Update the frontend to use share_status
-- But it's easier to fix the database to match the frontend expectations