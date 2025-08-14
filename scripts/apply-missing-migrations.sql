-- Targeted migration to add only missing components
-- Run this in your Supabase SQL Editor

-- 1. Add missing musical property columns to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS tempo INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS time_signature TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create collection_tracks table for ordering
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
CREATE POLICY "Users can manage their own collection tracks" ON collection_tracks
  FOR ALL USING (auth.uid() = user_id);

-- 3. Create the track position update function (needed for drag-drop reordering)
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

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_tracks_user_collection 
  ON collection_tracks(user_id, collection_name);
CREATE INDEX IF NOT EXISTS idx_collection_tracks_track_id 
  ON collection_tracks(track_id);

-- 5. Add trigger for updated_at on collection_tracks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collection_tracks_updated_at 
  BEFORE UPDATE ON collection_tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Migrate existing collection data (if any)
-- This populates collection_tracks based on existing tracks with collections
INSERT INTO collection_tracks (user_id, collection_name, track_id, position)
SELECT 
  t.user_id,
  t.collection,
  t.id,
  ROW_NUMBER() OVER (PARTITION BY t.user_id, t.collection ORDER BY t.created_at) - 1 as position
FROM tracks t
WHERE t.collection IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM collection_tracks ct 
    WHERE ct.user_id = t.user_id 
      AND ct.collection_name = t.collection 
      AND ct.track_id = t.id
  )
ORDER BY t.user_id, t.collection, t.created_at;

-- Verify the migration
SELECT 'Migration complete! Added:' as status;
SELECT '- Musical property columns (tempo, key, time_signature, genre, mood, notes)' as added;
SELECT '- collection_tracks table for drag-drop reordering' as added;
SELECT '- update_track_positions function' as added;
SELECT '- Migrated ' || COUNT(*) || ' tracks to collection_tracks' as added
FROM collection_tracks;