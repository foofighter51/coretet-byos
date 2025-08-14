-- CRITICAL SECURITY FIX: Enable RLS on exposed tables (Version 3 - Simplified)
-- Generated: 2025-08-09
-- Priority: CRITICAL - These tables are currently exposed without any access controls

-- First, ensure is_admin column exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================
-- 1. AUTH_DEBUG_LOG - Critical auth debugging info
-- ============================================
ALTER TABLE public.auth_debug_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin only access" ON public.auth_debug_log;

-- Only admins can access auth debug logs
CREATE POLICY "Admin only access" ON public.auth_debug_log
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- ============================================
-- 2. TASK_CATEGORIES - Shared reference data
-- ============================================
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can modify task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can insert task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can update task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can delete task categories" ON public.task_categories;

-- All users can view
CREATE POLICY "Users can view task categories" ON public.task_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert task categories" ON public.task_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Only admins can update
CREATE POLICY "Admins can update task categories" ON public.task_categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Only admins can delete
CREATE POLICY "Admins can delete task categories" ON public.task_categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- ============================================
-- 3. COLLABORATOR_MIGRATION_MAP - Migration data
-- ============================================
ALTER TABLE public.collaborator_migration_map ENABLE ROW LEVEL SECURITY;

-- Drop existing policy
DROP POLICY IF EXISTS "Admin only access" ON public.collaborator_migration_map;

-- Admin only access
CREATE POLICY "Admin only access" ON public.collaborator_migration_map
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- ============================================
-- 4. BACKUP TABLES - Historical data
-- ============================================

-- Enable RLS on all backup tables
ALTER TABLE public.backup_tracks_20250127 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_playlists_20250127 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_playlist_tracks_20250127 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin only access" ON public.backup_tracks_20250127;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_playlists_20250127;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_playlist_tracks_20250127;

-- Admin only access for backup_tracks
CREATE POLICY "Admin only access" ON public.backup_tracks_20250127
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Admin only access for backup_playlists
CREATE POLICY "Admin only access" ON public.backup_playlists_20250127
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Admin only access for backup_playlist_tracks
CREATE POLICY "Admin only access" ON public.backup_playlist_tracks_20250127
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    unprotected_tables TEXT[];
    protected_count INTEGER;
BEGIN
    -- Check for unprotected tables
    SELECT array_agg(t.tablename) INTO unprotected_tables
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'auth_debug_log',
        'task_categories',
        'collaborator_migration_map',
        'backup_tracks_20250127',
        'backup_playlists_20250127',
        'backup_playlist_tracks_20250127'
    )
    AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false);
    
    -- Count protected tables
    SELECT COUNT(*) INTO protected_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'auth_debug_log',
        'task_categories',
        'collaborator_migration_map',
        'backup_tracks_20250127',
        'backup_playlists_20250127',
        'backup_playlist_tracks_20250127'
    )
    AND c.relrowsecurity = true;
    
    IF unprotected_tables IS NOT NULL THEN
        RAISE WARNING 'SECURITY ISSUE - Tables still unprotected: %', unprotected_tables;
    ELSE
        RAISE NOTICE '✓ SUCCESS: All % critical tables now have RLS enabled', protected_count;
    END IF;
END $$;

-- Display summary
SELECT 
    t.tablename,
    CASE 
        WHEN c.relrowsecurity THEN '✓ Protected'
        ELSE '✗ EXPOSED'
    END as status,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'auth_debug_log',
    'task_categories',
    'collaborator_migration_map',
    'backup_tracks_20250127',
    'backup_playlists_20250127',
    'backup_playlist_tracks_20250127'
)
GROUP BY t.tablename, c.relrowsecurity
ORDER BY status DESC, t.tablename;