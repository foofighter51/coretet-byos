-- FIX TRACK ACCESS FOR SHARES (CORRECTED)
-- Allow users to see tracks in shared playlists

-- 1. Check current tracks policies
SELECT 
    'Current Track Policies' as section,
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = 'tracks'::regclass;

-- 2. Drop existing SELECT policies on tracks
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT polname
        FROM pg_policy
        WHERE polrelid = 'tracks'::regclass
            AND polcmd = 'r'  -- 'r' is for SELECT
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.polname) || ' ON tracks';
    END LOOP;
END $$;

-- 3. Create new comprehensive SELECT policy for tracks
CREATE POLICY "Users can view own tracks and tracks in shared playlists" ON tracks
    FOR SELECT
    USING (
        -- User owns the track
        user_id = auth.uid()
        OR
        -- Track is in a playlist shared with the user
        EXISTS (
            SELECT 1 
            FROM playlist_tracks pt
            JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
            WHERE pt.track_id = tracks.id
            AND LOWER(ps.shared_with_email) = LOWER(auth.email())
            AND ps.status = 'active'
        )
    );

-- 4. Test the access
SELECT 
    'Track Access Test' as section,
    COUNT(*) as visible_tracks
FROM tracks t
WHERE t.user_id = auth.uid()
   OR EXISTS (
       SELECT 1 
       FROM playlist_tracks pt
       JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
       WHERE pt.track_id = t.id
       AND LOWER(ps.shared_with_email) = LOWER(auth.email())
       AND ps.status = 'active'
   );

-- 5. Verify specific shared playlist tracks
SELECT 
    'Shared Playlist Tracks' as section,
    p.name as playlist_name,
    t.id as track_id,
    t.name as track_name,
    t.file_name,
    t.category,
    t.storage_path
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN playlist_tracks pt ON pt.playlist_id = p.id
JOIN tracks t ON t.id = pt.track_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
ORDER BY p.name, pt.position
LIMIT 20;

-- 6. Verify the policies were created
SELECT 
    'New Policies' as section,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'tracks'
    AND cmd = 'SELECT';