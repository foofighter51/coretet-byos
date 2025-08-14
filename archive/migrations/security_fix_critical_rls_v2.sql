-- CRITICAL SECURITY FIX: Enable RLS on exposed tables (Version 2)
-- Generated: 2025-08-09
-- Priority: CRITICAL - These tables are currently exposed without any access controls

-- First, check if profiles table has is_admin column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        -- Add is_admin column if it doesn't exist
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 1. Enable RLS on auth_debug_log (contains sensitive auth debugging info)
ALTER TABLE public.auth_debug_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin only access" ON public.auth_debug_log;

-- Create policy: Only admins can view auth debug logs (or all authenticated if no admin column)
CREATE POLICY "Admin only access" ON public.auth_debug_log
    FOR ALL
    TO authenticated
    USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_admin'
            ) THEN
                auth.uid() IN (
                    SELECT id FROM public.profiles WHERE is_admin = true
                )
            ELSE
                -- If no admin column, restrict to no one (safer than exposing to all)
                false
        END
    );

-- 2. Enable RLS on task_categories (shared reference table)
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can manage task categories" ON public.task_categories;

-- Create policy: All authenticated users can view task categories
CREATE POLICY "Users can view task categories" ON public.task_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can modify task categories (or no one if no admin system)
CREATE POLICY "Admins can manage task categories" ON public.task_categories
    FOR ALL
    TO authenticated
    USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_admin'
            ) THEN
                auth.uid() IN (
                    SELECT id FROM public.profiles WHERE is_admin = true
                )
            ELSE
                false
        END
    )
    WITH CHECK (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_admin'
            ) THEN
                auth.uid() IN (
                    SELECT id FROM public.profiles WHERE is_admin = true
                )
            ELSE
                false
        END
    );

-- 3. Enable RLS on collaborator_migration_map
ALTER TABLE public.collaborator_migration_map ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin only access" ON public.collaborator_migration_map;

-- Create policy: Admin only access for migration data
CREATE POLICY "Admin only access" ON public.collaborator_migration_map
    FOR ALL
    TO authenticated
    USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_admin'
            ) THEN
                auth.uid() IN (
                    SELECT id FROM public.profiles WHERE is_admin = true
                )
            ELSE
                false
        END
    );

-- 4. Enable RLS on backup tables (these should never be publicly accessible)
ALTER TABLE public.backup_tracks_20250127 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_playlists_20250127 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_playlist_tracks_20250127 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin only access" ON public.backup_tracks_20250127;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_playlists_20250127;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_playlist_tracks_20250127;

-- Create policies: Admin only access for backup tables
CREATE POLICY "Admin only access" ON public.backup_tracks_20250127
    FOR ALL
    TO authenticated
    USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_admin'
            ) THEN
                auth.uid() IN (
                    SELECT id FROM public.profiles WHERE is_admin = true
                )
            ELSE
                false
        END
    );

CREATE POLICY "Admin only access" ON public.backup_playlists_20250127
    FOR ALL
    TO authenticated
    USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_admin'
            ) THEN
                auth.uid() IN (
                    SELECT id FROM public.profiles WHERE is_admin = true
                )
            ELSE
                false
        END
    );

CREATE POLICY "Admin only access" ON public.backup_playlist_tracks_20250127
    FOR ALL
    TO authenticated
    USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_admin'
            ) THEN
                auth.uid() IN (
                    SELECT id FROM public.profiles WHERE is_admin = true
                )
            ELSE
                false
        END
    );

-- Verify RLS is enabled
DO $$
DECLARE
    unprotected_tables TEXT[];
BEGIN
    SELECT array_agg(tablename) INTO unprotected_tables
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
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
        AND c.relname = t.tablename
        AND c.relrowsecurity = true
    );
    
    IF unprotected_tables IS NOT NULL THEN
        RAISE WARNING 'Tables still unprotected: %', unprotected_tables;
    ELSE
        RAISE NOTICE 'All critical tables now have RLS enabled';
    END IF;
END $$;