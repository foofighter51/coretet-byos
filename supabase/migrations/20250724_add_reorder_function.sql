-- Function to update track positions in bulk for playlists
CREATE OR REPLACE FUNCTION update_track_positions(
  p_table_name TEXT, -- 'playlist_tracks' or 'collection_tracks'
  p_parent_id UUID,  -- playlist_id or collection_id
  p_positions JSONB  -- Array of {track_id, position} objects
) RETURNS VOID AS $$
DECLARE
  v_item JSONB;
  v_user_id UUID;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  -- Validate table name
  IF p_table_name NOT IN ('playlist_tracks', 'collection_tracks') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;

  -- Verify user owns the playlist/collection
  IF p_table_name = 'playlist_tracks' THEN
    -- Check playlist ownership
    IF NOT EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = p_parent_id 
      AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Unauthorized: You do not own this playlist';
    END IF;
  ELSE
    -- For collections, verify the user owns all tracks in the collection
    IF NOT EXISTS (
      SELECT 1 FROM tracks 
      WHERE collection = p_parent_id::TEXT 
      AND user_id = v_user_id
      LIMIT 1
    ) THEN
      RAISE EXCEPTION 'Unauthorized: You do not own this collection';
    END IF;
  END IF;

  -- Update positions
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_positions)
  LOOP
    IF p_table_name = 'playlist_tracks' THEN
      UPDATE playlist_tracks
      SET position = (v_item->>'position')::INTEGER
      WHERE playlist_id = p_parent_id
      AND track_id = (v_item->>'track_id')::UUID;
    ELSE
      UPDATE collection_tracks
      SET position = (v_item->>'position')::INTEGER
      WHERE collection_id = p_parent_id
      AND track_id = (v_item->>'track_id')::UUID
      AND user_id = v_user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;