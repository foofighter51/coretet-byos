-- SECURITY FIX: Add explicit search_path to all functions (Version 2)
-- Generated: 2025-08-09
-- Priority: HIGH - Functions without search_path are vulnerable to schema injection

-- Helper function to update search_path for existing functions
DO $$
DECLARE
    func RECORD;
    func_definition TEXT;
BEGIN
    -- Process each function that needs search_path fix (excluding broken ones)
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
            -- 'get_track_rating_counts', -- SKIP: References non-existent tables
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
        BEGIN
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
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to update function %.%(%): %', 
                    func.schema_name, func.function_name, func.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- Fix or replace the broken get_track_rating_counts function
DROP FUNCTION IF EXISTS public.get_track_rating_counts(uuid, uuid);

-- Create a new version using the current tables
CREATE OR REPLACE FUNCTION public.get_track_rating_counts(p_track_id uuid, p_playlist_id uuid)
RETURNS json
LANGUAGE sql
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT json_build_object(
    'listened', COUNT(*) FILTER (WHERE ptr.rating = 'listened'),
    'liked', COUNT(*) FILTER (WHERE ptr.rating = 'liked'),
    'loved', COUNT(*) FILTER (WHERE ptr.rating = 'loved'),
    'total_ratings', COUNT(*),
    'raters', json_agg(
      json_build_object(
        'user_id', ptr.user_id,
        'email', prof.email,
        'rating', ptr.rating,
        'rated_at', ptr.created_at
      ) ORDER BY ptr.created_at DESC
    )
  )
  FROM playlist_track_ratings ptr
  JOIN playlist_tracks pt ON pt.id = ptr.playlist_track_id
  JOIN profiles prof ON prof.id = ptr.user_id
  WHERE pt.track_id = p_track_id 
  AND pt.playlist_id = p_playlist_id;
$$;

-- Verify all functions have search_path set
DO $$
DECLARE
    vulnerable_functions TEXT[];
    fixed_count INTEGER;
BEGIN
    -- Count non-aggregate functions with search_path
    SELECT COUNT(*) INTO fixed_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')  -- Regular functions and procedures only
    AND p.prorettype != 'pg_catalog.trigger'::pg_catalog.regtype  -- Exclude triggers
    AND pg_get_functiondef(p.oid) LIKE '%search_path%';
    
    -- Find non-aggregate functions still without search_path
    SELECT array_agg(proname) INTO vulnerable_functions
    FROM (
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prokind IN ('f', 'p')  -- Regular functions and procedures only
        AND p.prorettype != 'pg_catalog.trigger'::pg_catalog.regtype  -- Exclude triggers
        AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%'
        LIMIT 10
    ) AS funcs;
    
    IF vulnerable_functions IS NOT NULL THEN
        RAISE WARNING 'Some functions still without search_path (showing first 10): %', vulnerable_functions;
        RAISE NOTICE 'To fix these, add SET search_path = public, pg_catalog to each function';
    ELSE
        RAISE NOTICE '✓ SUCCESS: All regular functions now have explicit search_path';
    END IF;
    
    RAISE NOTICE 'Total functions with search_path: %', fixed_count;
END $$;