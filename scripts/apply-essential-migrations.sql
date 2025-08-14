-- Essential migrations to run for CoreTet functionality
-- Run these in order in your Supabase SQL Editor

-- 1. Add artist and collection fields (if missing)
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS artist TEXT,
ADD COLUMN IF NOT EXISTS collection TEXT;

-- 2. Add rating fields (if missing)
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS listened BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS liked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loved BOOLEAN DEFAULT false;

-- 3. Add musical property fields (if missing)
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS tempo INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS time_signature TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 4. Create collection_tracks table for ordering (if missing)
CREATE TABLE IF NOT EXISTS collection_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_name TEXT NOT NULL,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, collection_name, track_id),
  UNIQUE(user_id, collection_name, position)
);

-- Enable RLS on collection_tracks
ALTER TABLE collection_tracks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for collection_tracks
DROP POLICY IF EXISTS "Users can manage their own collection tracks" ON collection_tracks;
CREATE POLICY "Users can manage their own collection tracks" ON collection_tracks
  FOR ALL USING (auth.uid() = user_id);

-- 5. Create or replace the track position update function
CREATE OR REPLACE FUNCTION update_track_positions(
  p_entity_id UUID,
  p_track_id UUID,
  p_new_position INTEGER,
  p_entity_type TEXT DEFAULT 'playlist'
)
RETURNS void AS $$
DECLARE
  v_old_position INTEGER;
  v_user_id UUID;
  v_collection_name TEXT;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_entity_type = 'playlist' THEN
    -- Check if user owns the playlist
    IF NOT EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = p_entity_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Unauthorized: User does not own this playlist';
    END IF;

    -- Get current position
    SELECT position INTO v_old_position
    FROM playlist_tracks
    WHERE playlist_id = p_entity_id AND track_id = p_track_id;

    IF v_old_position IS NULL THEN
      RAISE EXCEPTION 'Track not found in playlist';
    END IF;

    -- Update positions
    IF v_old_position < p_new_position THEN
      -- Moving down: decrease position of tracks in between
      UPDATE playlist_tracks
      SET position = position - 1
      WHERE playlist_id = p_entity_id
        AND position > v_old_position
        AND position <= p_new_position;
    ELSIF v_old_position > p_new_position THEN
      -- Moving up: increase position of tracks in between
      UPDATE playlist_tracks
      SET position = position + 1
      WHERE playlist_id = p_entity_id
        AND position >= p_new_position
        AND position < v_old_position;
    END IF;

    -- Set new position for the moved track
    UPDATE playlist_tracks
    SET position = p_new_position
    WHERE playlist_id = p_entity_id AND track_id = p_track_id;

  ELSIF p_entity_type = 'collection' THEN
    -- For collections, p_entity_id is actually the collection name
    v_collection_name := p_entity_id::TEXT;

    -- Get current position
    SELECT position INTO v_old_position
    FROM collection_tracks
    WHERE user_id = v_user_id 
      AND collection_name = v_collection_name 
      AND track_id = p_track_id;

    IF v_old_position IS NULL THEN
      RAISE EXCEPTION 'Track not found in collection';
    END IF;

    -- Update positions
    IF v_old_position < p_new_position THEN
      UPDATE collection_tracks
      SET position = position - 1
      WHERE user_id = v_user_id
        AND collection_name = v_collection_name
        AND position > v_old_position
        AND position <= p_new_position;
    ELSIF v_old_position > p_new_position THEN
      UPDATE collection_tracks
      SET position = position + 1
      WHERE user_id = v_user_id
        AND collection_name = v_collection_name
        AND position >= p_new_position
        AND position < v_old_position;
    END IF;

    -- Set new position for the moved track
    UPDATE collection_tracks
    SET position = p_new_position
    WHERE user_id = v_user_id
      AND collection_name = v_collection_name
      AND track_id = p_track_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_tracks_user_collection 
  ON collection_tracks(user_id, collection_name);
CREATE INDEX IF NOT EXISTS idx_collection_tracks_track_id 
  ON collection_tracks(track_id);

-- 7. Create updated_at trigger function if missing
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Add trigger to collection_tracks
DROP TRIGGER IF EXISTS update_collection_tracks_updated_at ON collection_tracks;
CREATE TRIGGER update_collection_tracks_updated_at 
  BEFORE UPDATE ON collection_tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tracks'
  AND table_schema = 'public'
ORDER BY ordinal_position;