-- Create a function to insert audio sections with proper auth context
CREATE OR REPLACE FUNCTION create_audio_section(
  p_track_id UUID,
  p_name TEXT,
  p_start_time DECIMAL,
  p_end_time DECIMAL,
  p_color TEXT
) RETURNS audio_sections AS $$
DECLARE
  v_user_id UUID;
  v_new_section audio_sections;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user owns the track
  IF NOT EXISTS (
    SELECT 1 FROM tracks 
    WHERE id = p_track_id 
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User does not own this track';
  END IF;
  
  -- Insert the section
  INSERT INTO audio_sections (
    track_id,
    name,
    start_time,
    end_time,
    color,
    created_by
  ) VALUES (
    p_track_id,
    p_name,
    p_start_time,
    p_end_time,
    p_color,
    v_user_id
  ) RETURNING * INTO v_new_section;
  
  RETURN v_new_section;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_audio_section TO authenticated;