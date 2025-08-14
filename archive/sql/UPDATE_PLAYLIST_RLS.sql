-- UPDATE PLAYLIST RLS POLICIES
-- Fix existing policies to include shared access

-- 1. Drop ALL existing SELECT policies on playlists
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT polname
        FROM pg_policy
        WHERE polrelid = 'playlists'::regclass
            AND polcmd = 'r'  -- 'r' is for SELECT
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.polname) || ' ON playlists';
    END LOOP;
END $$;

-- 2. Create comprehensive SELECT policy
CREATE POLICY "Users can view own and shared playlists" ON playlists
    FOR SELECT
    USING (
        -- User owns the playlist
        user_id = auth.uid()
        OR
        -- Playlist is shared with user (active shares only)
        EXISTS (
            SELECT 1 
            FROM playlist_shares ps
            WHERE ps.playlist_id = playlists.id
            AND LOWER(ps.shared_with_email) = LOWER(auth.email())
            AND ps.status = 'active'
        )
    );

-- 3. Fix playlist_tracks policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT polname
        FROM pg_policy
        WHERE polrelid = 'playlist_tracks'::regclass
            AND polcmd = 'r'  -- 'r' is for SELECT
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.polname) || ' ON playlist_tracks';
    END LOOP;
END $$;

CREATE POLICY "Users can view tracks in accessible playlists" ON playlist_tracks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM playlists p
            WHERE p.id = playlist_tracks.playlist_id
            AND (
                -- User owns the playlist
                p.user_id = auth.uid()
                OR
                -- Playlist is shared with user
                EXISTS (
                    SELECT 1 
                    FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
                    AND ps.status = 'active'
                )
            )
        )
    );

-- 4. Verify policies
SELECT 
    'Updated Policies' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('playlists', 'playlist_tracks')
    AND cmd = 'SELECT'
ORDER BY tablename, policyname;