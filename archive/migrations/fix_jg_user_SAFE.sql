-- =====================================================
-- FIX: JG User Issues - SAFE VERSION
-- This script first discovers your profiles table schema
-- Then only uses columns that actually exist
-- =====================================================

-- PART 0: DISCOVER PROFILES TABLE SCHEMA
-- =====================================================
DO $$
DECLARE
    v_columns TEXT;
    v_column_list TEXT[];
    v_has_email BOOLEAN := false;
    v_has_is_admin BOOLEAN := false;
    v_has_storage_used BOOLEAN := false;
    v_has_storage_quota BOOLEAN := false;
BEGIN
    -- Get all columns
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO v_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles';
    
    RAISE NOTICE 'Profiles table has these columns: %', v_columns;
    
    -- Check specific columns
    SELECT array_agg(column_name)
    INTO v_column_list
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles';
    
    v_has_email := 'email' = ANY(v_column_list);
    v_has_is_admin := 'is_admin' = ANY(v_column_list);
    v_has_storage_used := 'storage_used' = ANY(v_column_list);
    v_has_storage_quota := 'storage_quota' = ANY(v_column_list);
    
    RAISE NOTICE 'Has email column: %', v_has_email;
    RAISE NOTICE 'Has is_admin column: %', v_has_is_admin;
    RAISE NOTICE 'Has storage_used column: %', v_has_storage_used;
    RAISE NOTICE 'Has storage_quota column: %', v_has_storage_quota;
END $$;

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
    ELSE
        RAISE NOTICE 'view_preferences table already exists';
    END IF;

    -- Check if RLS is enabled
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'view_preferences' 
    INTO v_rls_enabled;

    IF NOT v_rls_enabled THEN
        ALTER TABLE public.view_preferences ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on view_preferences';
    ELSE
        RAISE NOTICE 'RLS already enabled on view_preferences';
    END IF;
END $$;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.view_preferences;

-- Create simple policy
CREATE POLICY "Enable all operations for authenticated users" 
ON public.view_preferences
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.view_preferences TO authenticated;

-- PART 2: Create JG's profile (dynamically based on actual columns)
-- =====================================================
DO $$
DECLARE
    v_jg_user_id UUID := '03098632-7f22-40c5-ab2a-b134081583f4';
    v_profile_exists BOOLEAN;
    v_column_list TEXT[];
    v_insert_sql TEXT;
    v_values_sql TEXT;
BEGIN
    -- Check if JG's profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = v_jg_user_id
    ) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        -- Get list of columns that exist
        SELECT array_agg(column_name)
        INTO v_column_list
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name != 'created_at'  -- Exclude auto-generated columns
        AND column_name != 'updated_at';
        
        -- Build dynamic INSERT statement based on existing columns
        v_insert_sql := 'INSERT INTO profiles (id';
        v_values_sql := 'VALUES ($1';
        
        -- Add email if it exists
        IF 'email' = ANY(v_column_list) THEN
            v_insert_sql := v_insert_sql || ', email';
            v_values_sql := v_values_sql || ', ''jonathangreener@gmail.com''';
        END IF;
        
        -- Add is_admin if it exists
        IF 'is_admin' = ANY(v_column_list) THEN
            v_insert_sql := v_insert_sql || ', is_admin';
            v_values_sql := v_values_sql || ', false';
        END IF;
        
        -- Add storage_used if it exists
        IF 'storage_used' = ANY(v_column_list) THEN
            v_insert_sql := v_insert_sql || ', storage_used';
            v_values_sql := v_values_sql || ', 0';
        END IF;
        
        -- Complete the SQL
        v_insert_sql := v_insert_sql || ') ' || v_values_sql || ')';
        
        -- Execute the dynamic SQL
        EXECUTE v_insert_sql USING v_jg_user_id;
        
        RAISE NOTICE 'Created profile for JG user with columns that exist';
    ELSE
        RAISE NOTICE 'Profile already exists for JG user';
        
        -- Update email if NULL and column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'email'
        ) THEN
            UPDATE profiles 
            SET email = 'jonathangreener@gmail.com'
            WHERE id = v_jg_user_id 
            AND email IS NULL;
        END IF;
    END IF;
END $$;

-- PART 3: Create profiles for all users (dynamically)
-- =====================================================
DO $$
DECLARE
    v_column_list TEXT[];
    v_has_email BOOLEAN;
    v_insert_sql TEXT;
    r RECORD;  -- Declare r as RECORD type
BEGIN
    -- Get column list
    SELECT array_agg(column_name)
    INTO v_column_list
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles';
    
    v_has_email := 'email' = ANY(v_column_list);
    
    -- Create profiles for users who don't have one
    FOR r IN 
        SELECT u.id, u.email
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = u.id
        )
        AND u.email IS NOT NULL
    LOOP
        BEGIN
            IF v_has_email THEN
                INSERT INTO profiles (id, email)
                VALUES (r.id, r.email)
                ON CONFLICT (id) DO NOTHING;
            ELSE
                INSERT INTO profiles (id)
                VALUES (r.id)
                ON CONFLICT (id) DO NOTHING;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not create profile for user %: %', r.email, SQLERRM;
        END;
    END LOOP;
END $$;

-- PART 4: Final diagnostic
-- =====================================================
DO $$
DECLARE
    v_jg_profile RECORD;
    v_jg_user_id UUID := '03098632-7f22-40c5-ab2a-b134081583f4';
BEGIN
    -- Check JG's profile
    SELECT * INTO v_jg_profile
    FROM profiles
    WHERE id = v_jg_user_id;
    
    IF v_jg_profile.id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: JG profile exists with ID: %', v_jg_profile.id;
    ELSE
        RAISE NOTICE 'FAILED: JG profile still missing!';
    END IF;
    
    -- Check view_preferences
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'view_preferences'
    ) THEN
        RAISE NOTICE 'SUCCESS: view_preferences table exists';
    ELSE
        RAISE NOTICE 'FAILED: view_preferences table missing!';
    END IF;
    
    -- Check RLS
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'view_preferences' 
        AND relrowsecurity = true
    ) THEN
        RAISE NOTICE 'SUCCESS: RLS enabled on view_preferences';
    ELSE
        RAISE NOTICE 'FAILED: RLS not enabled on view_preferences!';
    END IF;
END $$;