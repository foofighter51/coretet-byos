-- =====================================================
-- FIX: view_preferences RLS policies
-- Date: 2025-08-09
-- Issue: 406 errors indicate RLS is enabled but policies are missing
-- This migration ensures view_preferences has proper RLS policies
-- =====================================================

-- First, check if the table exists
DO $$
BEGIN
    -- Check if view_preferences table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'view_preferences') THEN
        
        -- Create the table if it doesn't exist
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
        
        -- Create index
        CREATE INDEX idx_view_preferences_user_view 
        ON public.view_preferences(user_id, view_type, view_id);
        
        RAISE NOTICE 'Created view_preferences table';
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.view_preferences ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.view_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.view_preferences;

-- Create RLS policies
-- SELECT: Users can only see their own preferences
CREATE POLICY "Users can view own preferences" 
ON public.view_preferences
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" 
ON public.view_preferences
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own preferences
CREATE POLICY "Users can update own preferences" 
ON public.view_preferences
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" 
ON public.view_preferences
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create or replace the upsert function
CREATE OR REPLACE FUNCTION upsert_view_preference(
    p_view_type TEXT,
    p_view_id TEXT,
    p_sort_by TEXT,
    p_sort_direction TEXT,
    p_view_mode TEXT,
    p_manual_positions JSONB DEFAULT NULL
)
RETURNS view_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result view_preferences;
BEGIN
    INSERT INTO view_preferences (
        user_id,
        view_type,
        view_id,
        sort_by,
        sort_direction,
        view_mode,
        manual_positions,
        updated_at
    )
    VALUES (
        auth.uid(),
        p_view_type,
        p_view_id,
        p_sort_by,
        p_sort_direction,
        p_view_mode,
        p_manual_positions,
        NOW()
    )
    ON CONFLICT (user_id, view_type, view_id)
    DO UPDATE SET
        sort_by = EXCLUDED.sort_by,
        sort_direction = EXCLUDED.sort_direction,
        view_mode = EXCLUDED.view_mode,
        manual_positions = EXCLUDED.manual_positions,
        updated_at = NOW()
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION upsert_view_preference TO authenticated;

-- Also ensure anon role can't access (for security)
REVOKE ALL ON public.view_preferences FROM anon;

-- Verify the fix
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'view_preferences';
    
    IF policy_count = 4 THEN
        RAISE NOTICE 'SUCCESS: All 4 RLS policies created for view_preferences';
    ELSE
        RAISE WARNING 'WARNING: Expected 4 policies, found %', policy_count;
    END IF;
END $$;

-- Test that RLS is properly configured
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'view_preferences'
ORDER BY cmd;