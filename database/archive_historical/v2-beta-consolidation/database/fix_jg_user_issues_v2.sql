-- =====================================================
-- FIX: Specific user issues with login and upload (V2 - Schema Compatible)
-- Date: 2025-08-12
-- Issues: 
-- 1. 406 errors on view_preferences (RLS policy issue)
-- 2. InvalidKey errors on upload (storage path sanitization)
-- 3. Missing profile records
-- =====================================================

-- First, let's check what columns exist in profiles table
DO $$
DECLARE
    v_columns TEXT;
BEGIN
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO v_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles';
    
    RAISE NOTICE 'Profiles table columns: %', v_columns;
END $$;

-- First, let's check if view_preferences table exists and has proper RLS
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
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.view_preferences;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.view_preferences;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.view_preferences;

-- Create simple, permissive policies that should work for all authenticated users
CREATE POLICY "Enable all operations for authenticated users" 
ON public.view_preferences
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.view_preferences TO authenticated;

-- Check and create missing profile for JG user specifically
-- Using minimal columns that should exist in any profiles table
DO $$
DECLARE
    v_jg_user_id UUID := '03098632-7f22-40c5-ab2a-b134081583f4';
    v_profile_exists BOOLEAN;
    v_has_email_column BOOLEAN;
    v_has_is_admin_column BOOLEAN;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) INTO v_has_email_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) INTO v_has_is_admin_column;
    
    -- Check if JG's profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = v_jg_user_id
    ) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        -- Create profile with only the columns that exist
        IF v_has_email_column AND v_has_is_admin_column THEN
            INSERT INTO profiles (id, email, is_admin)
            VALUES (
                v_jg_user_id,
                'jonathangreener@gmail.com',
                false
            );
        ELSIF v_has_email_column THEN
            INSERT INTO profiles (id, email)
            VALUES (
                v_jg_user_id,
                'jonathangreener@gmail.com'
            );
        ELSE
            -- Minimal insert with just ID
            INSERT INTO profiles (id)
            VALUES (v_jg_user_id);
        END IF;
        
        RAISE NOTICE 'Created missing profile for JG user';
    ELSE
        RAISE NOTICE 'Profile already exists for JG user';
    END IF;
END $$;

-- Create profiles for all users who don't have one (using minimal columns)
INSERT INTO profiles (id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
)
AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Update email column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        UPDATE profiles p
        SET email = u.email
        FROM auth.users u
        WHERE p.id = u.id
        AND p.email IS NULL
        AND u.email IS NOT NULL;
    END IF;
END $$;

-- Create a diagnostic function to check user's access
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
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT 'User Exists', 'FAIL', 'User not found';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 'User Exists', 'PASS', 'User ID: ' || v_user_id::TEXT;
    
    -- Check profile
    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
        RETURN QUERY SELECT 'Profile Exists', 'PASS', 'Profile found';
    ELSE
        RETURN QUERY SELECT 'Profile Exists', 'FAIL', 'Profile missing - CRITICAL';
    END IF;
    
    -- Check view_preferences access
    IF EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE grantee = 'authenticated' 
        AND table_name = 'view_preferences'
    ) THEN
        RETURN QUERY SELECT 'View Preferences Access', 'PASS', 'Table accessible';
    ELSE
        RETURN QUERY SELECT 'View Preferences Access', 'FAIL', 'No access to table';
    END IF;
    
    -- Check if user has any tracks
    IF EXISTS (SELECT 1 FROM tracks WHERE user_id = v_user_id) THEN
        RETURN QUERY SELECT 'Has Tracks', 'PASS', 'User has tracks';
    ELSE
        RETURN QUERY SELECT 'Has Tracks', 'INFO', 'No tracks yet';
    END IF;
    
    -- Check view_preferences table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
    ) THEN
        RETURN QUERY SELECT 'View Preferences Table', 'PASS', 'Table exists';
    ELSE
        RETURN QUERY SELECT 'View Preferences Table', 'FAIL', 'Table missing';
    END IF;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION check_user_access IS 'Diagnostic function to check user access issues. Run with: SELECT * FROM check_user_access(''user@email.com'');';

-- Final check
SELECT * FROM check_user_access('jonathangreener@gmail.com');