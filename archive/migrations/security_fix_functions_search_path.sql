-- SECURITY FIX: Add explicit search_path to all functions
-- Generated: 2025-08-09
-- Priority: HIGH - Functions without search_path are vulnerable to schema injection

-- Helper function to update search_path for existing functions
DO $$
DECLARE
    func RECORD;
    func_definition TEXT;
BEGIN
    -- Process each function that needs search_path fix
    FOR func IN
        SELECT 
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'handle_updated_at',
            'create_audio_section',
            'reorder_tasks',
            'get_next_task_order',
            'update_track_positions',
            'auto_accept_playlist_shares',
            'check_no_variant_chains',
            'get_variation_count',
            'unlink_all_variations',
            'migrate_collaborators_to_auth',
            'get_track_rating_counts',
            'validate_share_token',
            'upsert_view_preference',
            'get_next_iteration_number',
            'update_updated_at',
            'update_collection_track_order',
            'get_collection_track_order',
            'generate_invite_code',
            'handle_new_user',
            'update_user_storage',
            'update_updated_at_column'
        )
    LOOP
        -- Get the current function definition
        SELECT pg_get_functiondef(p.oid) INTO func_definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = func.schema_name
        AND p.proname = func.function_name
        AND pg_get_function_identity_arguments(p.oid) = func.args;
        
        -- Add SET search_path if not already present
        IF func_definition NOT LIKE '%search_path%' THEN
            -- Replace the function with search_path added
            func_definition := regexp_replace(
                func_definition,
                '(LANGUAGE \w+)',
                E'\\1\n  SET search_path = public, pg_catalog',
                'i'
            );
            
            -- Execute the updated function definition
            EXECUTE func_definition;
            
            RAISE NOTICE 'Updated search_path for function: %.%(%)', 
                func.schema_name, func.function_name, func.args;
        END IF;
    END LOOP;
END $$;

-- Example of how new functions should be created with explicit search_path
-- This is a template for future function creation:
/*
CREATE OR REPLACE FUNCTION public.example_function()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_catalog  -- Always include this line
AS $$
BEGIN
    -- Function body
END;
$$;
*/

-- Verify all functions have search_path set
DO $$
DECLARE
    vulnerable_functions TEXT[];
BEGIN
    SELECT array_agg(p.proname) INTO vulnerable_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        JOIN pg_database db ON db.oid = d.refobjid
        WHERE d.objid = p.oid
        AND d.deptype = 'e'
    )
    AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%';
    
    IF vulnerable_functions IS NOT NULL THEN
        RAISE WARNING 'Functions still without search_path: %', vulnerable_functions;
    ELSE
        RAISE NOTICE 'All functions now have explicit search_path';
    END IF;
END $$;