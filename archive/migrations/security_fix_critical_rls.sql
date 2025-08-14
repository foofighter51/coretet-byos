-- CRITICAL SECURITY FIX: Enable RLS on exposed tables
-- Generated: 2025-08-09
-- Priority: CRITICAL - These tables are currently exposed without any access controls

-- 1. Enable RLS on auth_debug_log (contains sensitive auth debugging info)
ALTER TABLE public.auth_debug_log ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admins can view auth debug logs
CREATE POLICY "Admin only access" ON public.auth_debug_log
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    ));

-- 2. Enable RLS on task_categories
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

-- Create policy: All authenticated users can view task categories (shared reference data)
CREATE POLICY "Users can view task categories" ON public.task_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can modify task categories
CREATE POLICY "Admins can manage task categories" ON public.task_categories
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    ))
    WITH CHECK (auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    ));

-- 3. Enable RLS on collaborator_migration_map
ALTER TABLE public.collaborator_migration_map ENABLE ROW LEVEL SECURITY;

-- Create policy: Admin only access for migration data
CREATE POLICY "Admin only access" ON public.collaborator_migration_map
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    ));

-- 4. Enable RLS on backup tables (these should never be publicly accessible)
ALTER TABLE public.backup_tracks_20250127 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_playlists_20250127 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_playlist_tracks_20250127 ENABLE ROW LEVEL SECURITY;

-- Create policies: Admin only access for backup tables
CREATE POLICY "Admin only access" ON public.backup_tracks_20250127
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    ));

CREATE POLICY "Admin only access" ON public.backup_playlists_20250127
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    ));

CREATE POLICY "Admin only access" ON public.backup_playlist_tracks_20250127
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    ));

-- Verify RLS is enabled
DO $$
DECLARE
    unprotected_tables TEXT[];
BEGIN
    SELECT array_agg(tablename) INTO unprotected_tables
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
        'auth_debug_log',
        'task_categories',
        'collaborator_migration_map',
        'backup_tracks_20250127',
        'backup_playlists_20250127',
        'backup_playlist_tracks_20250127'
    )
    AND NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = tablename
        AND c.relrowsecurity = true
    );
    
    IF unprotected_tables IS NOT NULL THEN
        RAISE WARNING 'Tables still unprotected: %', unprotected_tables;
    ELSE
        RAISE NOTICE 'All critical tables now have RLS enabled';
    END IF;
END $$;