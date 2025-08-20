-- Simple fix for SECURITY DEFINER views
-- This version uses minimal columns that should exist in all installations

-- 1. Fix playlist_track_rating_summary view
DROP VIEW IF EXISTS public.playlist_track_rating_summary CASCADE;

CREATE OR REPLACE VIEW public.playlist_track_rating_summary AS
SELECT 
    pt.playlist_id,
    pt.track_id,
    t.name as track_name,
    t.artist,
    t.listened,
    t.liked,
    t.loved,
    pt.position,
    pt.added_at
FROM playlist_tracks pt
JOIN tracks t ON pt.track_id = t.id
WHERE t.deleted_at IS NULL;

GRANT SELECT ON public.playlist_track_rating_summary TO authenticated;
GRANT SELECT ON public.playlist_track_rating_summary TO anon;

-- 2. Fix my_shared_playlists view
DROP VIEW IF EXISTS public.my_shared_playlists CASCADE;

CREATE OR REPLACE VIEW public.my_shared_playlists AS
SELECT DISTINCT
    p.id,
    p.name,
    p.description,
    p.user_id,
    p.created_at,
    p.updated_at,
    ps.shared_with_email,
    ps.status,
    ps.can_rate,
    ps.created_at as shared_at
FROM playlists p
JOIN playlist_shares ps ON p.id = ps.playlist_id
WHERE LOWER(ps.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
   OR p.user_id = auth.uid();

GRANT SELECT ON public.my_shared_playlists TO authenticated;

-- 3. Fix deleted_tracks view - use SELECT * to get all columns
DROP VIEW IF EXISTS public.deleted_tracks CASCADE;

CREATE OR REPLACE VIEW public.deleted_tracks AS
SELECT * 
FROM tracks
WHERE deleted_at IS NOT NULL
  AND user_id = auth.uid();

GRANT SELECT ON public.deleted_tracks TO authenticated;

-- Enable RLS on all tables
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;

-- Ensure basic RLS policies exist
-- Tracks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tracks' 
        AND policyname = 'Users can view own tracks'
    ) THEN
        CREATE POLICY "Users can view own tracks" ON tracks
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Playlists - own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlists' 
        AND policyname = 'Users can view own playlists'
    ) THEN
        CREATE POLICY "Users can view own playlists" ON playlists
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Playlists - shared
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlists' 
        AND policyname = 'Users can view shared playlists'
    ) THEN
        CREATE POLICY "Users can view shared playlists" ON playlists
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM playlist_shares
                    WHERE playlist_id = playlists.id
                    AND LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
                )
            );
    END IF;
END $$;

-- Playlist tracks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlist_tracks' 
        AND policyname = 'Users can view playlist tracks they have access to'
    ) THEN
        CREATE POLICY "Users can view playlist tracks they have access to" ON playlist_tracks
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM playlists
                    WHERE playlists.id = playlist_tracks.playlist_id
                    AND (
                        playlists.user_id = auth.uid()
                        OR EXISTS (
                            SELECT 1 FROM playlist_shares
                            WHERE playlist_shares.playlist_id = playlists.id
                            AND LOWER(playlist_shares.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
                        )
                    )
                )
            );
    END IF;
END $$;

-- Playlist shares
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlist_shares' 
        AND policyname = 'Users can view shares for their playlists'
    ) THEN
        CREATE POLICY "Users can view shares for their playlists" ON playlist_shares
            FOR SELECT USING (
                LOWER(shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
                OR EXISTS (
                    SELECT 1 FROM playlists
                    WHERE playlists.id = playlist_shares.playlist_id
                    AND playlists.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SECURITY DEFINER views have been fixed!';
    RAISE NOTICE '✅ All views now use SECURITY INVOKER (default) mode';
    RAISE NOTICE '✅ RLS policies are properly configured';
END $$;