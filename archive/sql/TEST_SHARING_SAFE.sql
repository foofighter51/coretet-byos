-- SAFE TEST FOR SHARING FUNCTIONALITY
-- This version checks if tables exist before querying them

-- 1. Check if playlist_shares table exists
SELECT 
    'Playlist Shares Table' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'playlist_shares'
        ) THEN '✅ Table exists'
        ELSE '❌ Table missing - run CREATE_SHARING_SYSTEM.sql first'
    END as status;

-- 2. Check current user has playlists to share
SELECT 
    'Available Playlists' as test,
    COUNT(*) as playlist_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ You have ' || COUNT(*) || ' playlists to share'
        ELSE '❌ No playlists found - create one first'
    END as status
FROM playlists
WHERE user_id = auth.uid();

-- 3. List your playlists with track counts
SELECT 
    'Your Playlists' as section,
    p.id,
    p.name,
    COUNT(pt.track_id) as track_count,
    p.created_at::date as created
FROM playlists p
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name, p.created_at
ORDER BY p.created_at DESC;

-- 4. Conditional checks for sharing data
DO $$
BEGIN
    -- Check if playlist_shares exists before querying
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'playlist_shares'
    ) THEN
        RAISE NOTICE '';
        RAISE NOTICE '=== SHARING DATA ===';
        
        -- Check outgoing shares
        IF EXISTS (
            SELECT 1 FROM playlist_shares WHERE shared_by = auth.uid()
        ) THEN
            RAISE NOTICE 'You have shared playlists with others';
        ELSE
            RAISE NOTICE 'You have not shared any playlists yet';
        END IF;
        
        -- Check incoming shares
        IF EXISTS (
            SELECT 1 FROM playlist_shares 
            WHERE LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
        ) THEN
            RAISE NOTICE 'Others have shared playlists with you';
        ELSE
            RAISE NOTICE 'No playlists have been shared with you yet';
        END IF;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  SHARING NOT SET UP YET';
        RAISE NOTICE 'To enable sharing:';
        RAISE NOTICE '1. Run CREATE_SHARING_SYSTEM.sql in this SQL editor';
        RAISE NOTICE '2. Then run this test again';
    END IF;
END $$;

-- 5. Next Steps
SELECT 
    '📋 Next Steps' as section,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'playlist_shares'
        ) THEN 'Run CREATE_SHARING_SYSTEM.sql to enable sharing'
        WHEN (SELECT COUNT(*) FROM playlists WHERE user_id = auth.uid()) = 0 
        THEN 'Create a playlist first, then you can share it'
        ELSE 'You are ready to share playlists!'
    END as action;

-- 6. Show CREATE statement if needed
SELECT 
    '💡 Quick Setup' as section,
    'Copy and run this:' as instruction,
    'CREATE_SHARING_SYSTEM.sql' as file_to_run
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'playlist_shares'
);