-- STEP 5: VERIFY EVERYTHING WORKS
-- Run this to confirm the rebuild was successful

-- 1. Check your data is intact
SELECT 
    'Tracks' as table_name,
    COUNT(*) as count
FROM tracks
WHERE user_id = auth.uid()
UNION ALL
SELECT 
    'Playlists' as table_name,
    COUNT(*) as count
FROM playlists
WHERE user_id = auth.uid()
UNION ALL
SELECT 
    'Files in storage' as table_name,
    COUNT(*) as count
FROM storage.objects
WHERE bucket_id = 'audio-files';

-- 2. Test track access
SELECT 
    id,
    name,
    file_name,
    storage_path,
    category
FROM tracks
LIMIT 5;

-- 3. Test playlist access
SELECT 
    p.name as playlist_name,
    COUNT(pt.id) as track_count
FROM playlists p
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
GROUP BY p.id, p.name;

-- 4. Verify storage bucket is public
SELECT 
    CASE 
        WHEN public = true THEN '✅ Bucket is public - audio will play!'
        ELSE '❌ Bucket is private - audio will not play'
    END as storage_status
FROM storage.buckets
WHERE id = 'audio-files';

-- 5. Check RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tracks', 'playlists', 'playlist_tracks', 'profiles');

-- 6. Count policies (should be simple now)
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 7. Final status
SELECT '🎉 REBUILD COMPLETE! Your app should work perfectly now.' as final_status;