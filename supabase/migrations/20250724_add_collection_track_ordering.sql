-- Add track ordering support for collections/albums

-- Create a junction table for collection tracks with position
CREATE TABLE IF NOT EXISTS collection_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, track_id, user_id),
  -- Add foreign key constraint that references the collection from track metadata
  CONSTRAINT valid_collection CHECK (
    EXISTS (
      SELECT 1 FROM tracks t 
      WHERE t.id = track_id 
      AND t.collection = collection_id::text
    )
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_collection_tracks_collection_id ON collection_tracks(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_tracks_track_id ON collection_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_collection_tracks_user_id ON collection_tracks(user_id);

-- Enable RLS
ALTER TABLE collection_tracks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own collection tracks" ON collection_tracks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own collection tracks" ON collection_tracks
  FOR ALL USING (auth.uid() = user_id);

-- Function to get tracks in a collection ordered by position
CREATE OR REPLACE FUNCTION get_collection_tracks(p_collection_id TEXT, p_user_id UUID)
RETURNS TABLE (
  track_id UUID,
  position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT ct.track_id, ct.position
  FROM collection_tracks ct
  WHERE ct.collection_id = p_collection_id::UUID
  AND ct.user_id = p_user_id
  ORDER BY ct.position;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update track positions in bulk
CREATE OR REPLACE FUNCTION update_track_positions(
  p_table_name TEXT, -- 'playlist_tracks' or 'collection_tracks'
  p_parent_id UUID,  -- playlist_id or collection_id
  p_positions JSONB  -- Array of {track_id, position} objects
) RETURNS VOID AS $$
DECLARE
  v_item JSONB;
BEGIN
  -- Validate table name
  IF p_table_name NOT IN ('playlist_tracks', 'collection_tracks') THEN
    RAISE EXCEPTION 'Invalid table name';
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
      AND user_id = auth.uid();
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing collection data (if any)
-- This creates entries for tracks that have a collection set
INSERT INTO collection_tracks (collection_id, track_id, user_id, position)
SELECT DISTINCT
  collection::UUID as collection_id,
  id as track_id,
  user_id,
  ROW_NUMBER() OVER (PARTITION BY collection, user_id ORDER BY created_at) - 1 as position
FROM tracks
WHERE collection IS NOT NULL
AND collection ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' -- Valid UUID
ON CONFLICT (collection_id, track_id, user_id) DO NOTHING;