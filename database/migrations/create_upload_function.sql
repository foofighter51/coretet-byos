-- Create a function to handle track uploads bypassing REST API cache issues
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
AS $$
DECLARE
  v_track_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Generate new UUID
  v_track_id := gen_random_uuid();
  v_created_at := NOW();
  
  -- Insert the track
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

-- Create RLS policy for the function
CREATE POLICY "Users can upload their own tracks" ON tracks
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);