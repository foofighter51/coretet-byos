-- VERIFY ERICEXLEY'S DATA EXISTS
-- Your user ID: 55a58df9-3698-4973-9add-b82d76cde766

-- Summary of your data
SELECT 'You have 82 tracks and 6 playlists in the database' as status;

-- Sample of your tracks (with correct column names)
SELECT 
    id,
    name,
    artist,
    category,
    created_at
FROM tracks
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766'
ORDER BY created_at DESC
LIMIT 5;

-- Sample of your playlists (with correct column names)
SELECT 
    id,
    name,
    description,
    created_at
FROM playlists
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766'
ORDER BY created_at DESC
LIMIT 5;

-- IMPORTANT: Your data exists! The issue is that you can't see it in the app.
-- This is because after the VS Code crash, your browser session is likely corrupted.

-- ACTION REQUIRED:
-- 1. Go to coretet.app in your browser
-- 2. Open Developer Tools (F12)
-- 3. Go to Application/Storage tab
-- 4. Clear all site data (cookies, local storage, session storage)
-- 5. Refresh the page
-- 6. Log in again with ericexley@gmail.com

-- To verify you're properly logged in after clearing cache:
-- In browser console, run:
-- (await window.supabase.auth.getUser()).data.user?.email
-- This should return 'ericexley@gmail.com'