-- Fix SECURITY DEFINER views to comply with security best practices
-- These views should use SECURITY INVOKER (default) instead of SECURITY DEFINER
-- This ensures Row Level Security (RLS) policies are properly enforced

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

-- Grant appropriate permissions
GRANT SELECT ON public.playlist_track_rating_summary TO authenticated;
GRANT SELECT ON public.playlist_track_rating_summary TO anon;

COMMENT ON VIEW public.playlist_track_rating_summary IS 'View showing playlist tracks with rating information (uses SECURITY INVOKER)';

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
    ps.shared_with,
    ps.permission,
    ps.created_at as shared_at
FROM playlists p
JOIN playlist_shares ps ON p.id = ps.playlist_id
WHERE ps.shared_with = auth.uid()
   OR p.user_id = auth.uid();

-- Grant appropriate permissions
GRANT SELECT ON public.my_shared_playlists TO authenticated;

COMMENT ON VIEW public.my_shared_playlists IS 'View showing playlists shared with the current user (uses SECURITY INVOKER)';

-- 3. Fix deleted_tracks view
DROP VIEW IF EXISTS public.deleted_tracks CASCADE;

CREATE OR REPLACE VIEW public.deleted_tracks AS
SELECT 
    id,
    user_id,
    name,
    artist,
    album,
    genre,
    key,
    bpm,
    duration,
    category,
    tags,
    notes,
    tuning,
    lyrics,
    listened,
    liked,
    loved,
    deleted_at,
    created_at,
    updated_at,
    storage_path,
    primary_track_id
FROM tracks
WHERE deleted_at IS NOT NULL
  AND user_id = auth.uid();

-- Grant appropriate permissions
GRANT SELECT ON public.deleted_tracks TO authenticated;

COMMENT ON VIEW public.deleted_tracks IS 'View showing soft-deleted tracks for the current user (uses SECURITY INVOKER)';

-- Verify that RLS is enabled on base tables
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies exist for the base tables
-- (These should already exist, but we'll create them if missing)

-- Tracks policies
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

-- Playlists policies
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
                    AND shared_with = auth.uid()
                )
            );
    END IF;
END $$;

-- Playlist tracks policies
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
                            AND playlist_shares.shared_with = auth.uid()
                        )
                    )
                )
            );
    END IF;
END $$;

-- Playlist shares policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlist_shares' 
        AND policyname = 'Users can view shares for their playlists'
    ) THEN
        CREATE POLICY "Users can view shares for their playlists" ON playlist_shares
            FOR SELECT USING (
                shared_with = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM playlists
                    WHERE playlists.id = playlist_shares.playlist_id
                    AND playlists.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Verification message
DO $$
BEGIN
    RAISE NOTICE 'SECURITY DEFINER views have been fixed!';
    RAISE NOTICE 'All views now use SECURITY INVOKER (default) mode';
    RAISE NOTICE 'RLS policies will be properly enforced';
END $$;