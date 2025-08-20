-- ============================================================================
-- VERIFY AND FIX SCHEMA - PERMANENT SOLUTION
-- ============================================================================
-- This script checks for and removes any lingering 'analysis' column references
-- and forces PostgREST to reload its schema cache
-- ============================================================================

-- 1. Check if 'analysis' column exists (it shouldn't)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'tracks'
    AND column_name = 'analysis';

-- 2. If it exists, drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tracks' 
        AND column_name = 'analysis'
    ) THEN
        ALTER TABLE public.tracks DROP COLUMN IF EXISTS analysis CASCADE;
        RAISE NOTICE 'Dropped analysis column from tracks table';
    ELSE
        RAISE NOTICE 'Analysis column does not exist (good!)';
    END IF;
END $$;

-- 3. Check for any views that might reference 'analysis'
SELECT 
    schemaname,
    viewname,
    definition
FROM 
    pg_views
WHERE 
    definition LIKE '%analysis%'
    AND schemaname = 'public';

-- 4. Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- 5. Alternative method to force cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- 6. Verify current tracks table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'tracks'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- After running this script:
-- 1. Wait 1-2 minutes for cache to fully refresh
-- 2. Test uploads with the original FileUpload component
-- 3. If it works, we can remove the RPC workaround
-- ============================================================================