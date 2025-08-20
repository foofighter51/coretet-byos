-- =====================================================
-- FIX: Specific user issues with login and upload (FINAL VERSION)
-- Date: 2025-08-12
-- Issues: 
-- 1. 406 errors on view_preferences (RLS policy issue)
-- 2. Missing profile for JG user
-- =====================================================

-- PART 1: Fix view_preferences table and RLS
-- =====================================================
DO $$
DECLARE
    v_table_exists boolean;
    v_rls_enabled boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
    ) INTO v_table_exists;

    IF NOT v_table_exists THEN
        -- Create the table
        CREATE TABLE public.view_preferences (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            view_type TEXT NOT NULL,
            view_id TEXT NOT NULL,
            sort_by TEXT DEFAULT 'added',
            sort_direction TEXT DEFAULT 'desc',
            view_mode TEXT DEFAULT 'list',
            manual_positions JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, view_type, view_id)
        );
        
        CREATE INDEX idx_view_preferences_user_view 
        ON public.view_preferences(user_id, view_type, view_id);
        
        RAISE NOTICE 'Created view_preferences table';
    END IF;

    -- Check if RLS is enabled
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'view_preferences' 
    INTO v_rls_enabled;

    IF NOT v_rls_enabled THEN
        ALTER TABLE public.view_preferences ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on view_preferences';
    END IF;
END $$;

-- Drop all existing policies and recreate them
DROP POLICY IF EXISTS "Users can view own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.view_preferences;

-- Create simple, permissive policies
CREATE POLICY "Enable all operations for authenticated users" 
ON public.view_preferences
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.view_preferences TO authenticated;

-- PART 2: Fix missing profiles
-- =====================================================

-- First, fix any existing profiles with NULL emails
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL
AND u.email IS NOT NULL;

-- Create missing profile for JG specifically
DO $$
DECLARE
    v_jg_user_id UUID := '03098632-7f22-40c5-ab2a-b134081583f4';
    v_profile_exists BOOLEAN;
BEGIN
    -- Check if JG's profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = v_jg_user_id
    ) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        -- Create profile for JG
        INSERT INTO profiles (id, email, is_admin, storage_used, storage_quota)
        VALUES (
            v_jg_user_id,
            'jonathangreener@gmail.com',
            false,
            0,
            5368709120
        );
        RAISE NOTICE 'Created missing profile for JG user';
    ELSE
        RAISE NOTICE 'Profile already exists for JG user';
    END IF;
END $$;

-- Create profiles for all other users who don't have one
INSERT INTO profiles (id, email, is_admin, storage_used, storage_quota)
SELECT 
    u.id,
    u.email,
    false,
    0,
    5368709120
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
)
AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- PART 3: Diagnostic check
-- =====================================================
CREATE OR REPLACE FUNCTION check_user_access(user_email TEXT)
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_profile_record RECORD;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT 'User Exists', 'FAIL', 'User not found in auth.users';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 'User Exists', 'PASS', 'User ID: ' || v_user_id::TEXT;
    
    -- Check profile with details
    SELECT * INTO v_profile_record 
    FROM profiles 
    WHERE id = v_user_id;
    
    IF v_profile_record.id IS NOT NULL THEN
        RETURN QUERY SELECT 'Profile Exists', 'PASS', 
            'Email: ' || COALESCE(v_profile_record.email, 'NULL') || 
            ', Admin: ' || COALESCE(v_profile_record.is_admin::TEXT, 'NULL');
    ELSE
        RETURN QUERY SELECT 'Profile Exists', 'FAIL', 'Profile missing - CRITICAL';
    END IF;
    
    -- Check view_preferences table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
    ) THEN
        RETURN QUERY SELECT 'View Preferences Table', 'PASS', 'Table exists';
    ELSE
        RETURN QUERY SELECT 'View Preferences Table', 'FAIL', 'Table missing';
    END IF;
    
    -- Check RLS on view_preferences
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'view_preferences' 
        AND relrowsecurity = true
    ) THEN
        RETURN QUERY SELECT 'View Preferences RLS', 'PASS', 'RLS enabled';
    ELSE
        RETURN QUERY SELECT 'View Preferences RLS', 'FAIL', 'RLS not enabled';
    END IF;
    
    -- Check if user has any tracks
    IF EXISTS (SELECT 1 FROM tracks WHERE user_id = v_user_id) THEN
        RETURN QUERY 
        SELECT 'Has Tracks', 'PASS', 
               'Track count: ' || (SELECT COUNT(*) FROM tracks WHERE user_id = v_user_id)::TEXT;
    ELSE
        RETURN QUERY SELECT 'Has Tracks', 'INFO', 'No tracks yet';
    END IF;
END;
$$;

-- Run diagnostic for JG
SELECT * FROM check_user_access('jonathangreener@gmail.com');

-- Also check your main account
SELECT * FROM check_user_access('ericexley@gmail.com');