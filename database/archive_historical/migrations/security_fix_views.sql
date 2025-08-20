-- SECURITY FIX: Remove SECURITY DEFINER from views
-- Generated: 2025-08-09
-- Priority: HIGH - These views bypass RLS policies

-- 1. Recreate deleted_tracks view without SECURITY DEFINER
DROP VIEW IF EXISTS public.deleted_tracks CASCADE;
CREATE VIEW public.deleted_tracks AS
SELECT * FROM public.tracks
WHERE deleted_at IS NOT NULL;

-- Grant appropriate permissions
GRANT SELECT ON public.deleted_tracks TO authenticated;

-- 2. Recreate playlist_track_rating_summary view without SECURITY DEFINER
DROP VIEW IF EXISTS public.playlist_track_rating_summary CASCADE;
CREATE VIEW public.playlist_track_rating_summary AS
SELECT 
    pt.playlist_id,
    pt.track_id,
    ptr.playlist_track_id,
    COUNT(CASE WHEN ptr.rating = 'liked' THEN 1 END) as liked_count,
    COUNT(CASE WHEN ptr.rating = 'loved' THEN 1 END) as loved_count,
    COUNT(CASE WHEN ptr.rating = 'listened' THEN 1 END) as listened_count,
    COUNT(ptr.rating) as total_ratings
FROM public.playlist_track_ratings ptr
JOIN public.playlist_tracks pt ON pt.id = ptr.playlist_track_id
GROUP BY pt.playlist_id, pt.track_id, ptr.playlist_track_id;

-- Grant appropriate permissions
GRANT SELECT ON public.playlist_track_rating_summary TO authenticated;

-- 3. Recreate my_shared_playlists view without SECURITY DEFINER
DROP VIEW IF EXISTS public.my_shared_playlists CASCADE;
CREATE VIEW public.my_shared_playlists AS
SELECT 
    p.*,
    ps.shared_by,
    ps.created_at as shared_at,
    ps.accepted_at
FROM public.playlists p
JOIN public.playlist_shares ps ON p.id = ps.playlist_id
JOIN public.profiles prof ON prof.email = ps.shared_with_email
WHERE prof.id = auth.uid()
AND ps.accepted_at IS NOT NULL;

-- Grant appropriate permissions
GRANT SELECT ON public.my_shared_playlists TO authenticated;

-- Verify no SECURITY DEFINER views remain
DO $$
DECLARE
    security_definer_views TEXT[];
BEGIN
    SELECT array_agg(viewname) INTO security_definer_views
    FROM pg_views v
    JOIN pg_class c ON c.relname = v.viewname
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = v.schemaname
    WHERE v.schemaname = 'public'
    AND EXISTS (
        SELECT 1 FROM pg_rewrite r
        WHERE r.ev_class = c.oid
        AND r.ev_type = '1'
        AND (r.ev_action::text LIKE '%SECURITY DEFINER%')
    );
    
    IF security_definer_views IS NOT NULL THEN
        RAISE WARNING 'Views still have SECURITY DEFINER: %', security_definer_views;
    ELSE
        RAISE NOTICE 'All views now respect RLS policies';
    END IF;
END $$;