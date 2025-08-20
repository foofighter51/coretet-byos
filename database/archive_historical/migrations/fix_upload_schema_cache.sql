-- ============================================================================
-- FIX FOR UPLOAD SCHEMA CACHE ISSUE
-- ============================================================================
-- This script creates an RPC function to handle track uploads, bypassing 
-- Supabase's REST API schema cache that incorrectly references the 'analysis' column
--
-- Run this script in your Supabase SQL Editor:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Paste this entire script
-- 5. Click "Run"
-- ============================================================================

-- Drop the function if it already exists (for clean re-runs)
DROP FUNCTION IF EXISTS public.upload_track CASCADE;

-- Create the upload_track function
CREATE OR REPLACE FUNCTION public.upload_track(
  p_user_id UUID,
  p_name TEXT,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_storage_path TEXT,
  p_category TEXT DEFAULT 'songs',
  p_tags TEXT[] DEFAULT '{}',
  p_artist TEXT DEFAULT NULL,
  p_collection TEXT DEFAULT NULL,
  p_genre TEXT DEFAULT NULL,
  p_tempo INTEGER DEFAULT NULL,
  p_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Generate new UUID
  v_track_id := gen_random_uuid();
  v_created_at := NOW();
  
  -- Insert the track directly into the database
  INSERT INTO public.tracks (
    id,
    user_id,
    name,
    file_name,
    file_size,
    storage_path,
    category,
    tags,
    artist,
    collection,
    genre,
    tempo,
    key,
    created_at,
    updated_at
  ) VALUES (
    v_track_id,
    p_user_id,
    p_name,
    p_file_name,
    p_file_size,
    p_storage_path,
    p_category,
    p_tags,
    p_artist,
    p_collection,
    p_genre,
    p_tempo,
    p_key,
    v_created_at,
    v_created_at
  );
  
  -- Return the created track info
  RETURN QUERY
  SELECT v_track_id, v_created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upload_track TO authenticated;

-- Ensure RLS is enabled on the tracks table
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Create or replace the RLS policy for track uploads
DROP POLICY IF EXISTS "Users can upload their own tracks" ON tracks;
CREATE POLICY "Users can upload their own tracks" ON tracks
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verify the function was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'upload_track' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE 'Success: upload_track function created successfully!';
  ELSE
    RAISE EXCEPTION 'Error: upload_track function was not created';
  END IF;
END $$;

-- ============================================================================
-- IMPORTANT: After running this script, the upload functionality will use
-- this RPC function instead of the REST API, which should resolve the
-- 'analysis' column cache issue.
-- ============================================================================