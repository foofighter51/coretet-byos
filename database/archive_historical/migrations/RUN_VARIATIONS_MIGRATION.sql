-- Track Variations Feature Migration
-- Run this in the Supabase SQL editor

-- Add variations support to tracks
-- Every track is primary by default, unless it's assigned as a variant of another track

-- Add primary_track_id to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS primary_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL;

-- Create index for efficient variation queries
CREATE INDEX IF NOT EXISTS idx_tracks_primary_track_id ON tracks(primary_track_id);

-- Add constraint: a track cannot be its own primary
ALTER TABLE tracks 
DROP CONSTRAINT IF EXISTS check_not_self_primary;

ALTER TABLE tracks 
ADD CONSTRAINT check_not_self_primary 
CHECK (primary_track_id != id);

-- Add constraint: prevent circular references (a variant cannot have variants)
CREATE OR REPLACE FUNCTION check_no_variant_chains()
RETURNS TRIGGER AS $$
BEGIN
  -- If this track is being set as a variant
  IF NEW.primary_track_id IS NOT NULL THEN
    -- Check if any tracks have this track as their primary
    IF EXISTS (
      SELECT 1 FROM tracks 
      WHERE primary_track_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot make this track a variant - it has variants of its own';
    END IF;
    
    -- Check if the target primary track is itself a variant
    IF EXISTS (
      SELECT 1 FROM tracks 
      WHERE id = NEW.primary_track_id 
      AND primary_track_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot assign to this track - it is already a variant';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_variant_chains ON tracks;
CREATE TRIGGER prevent_variant_chains
BEFORE INSERT OR UPDATE OF primary_track_id ON tracks
FOR EACH ROW
EXECUTE FUNCTION check_no_variant_chains();

-- Function to get variation count for a track
CREATE OR REPLACE FUNCTION get_variation_count(track_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM tracks 
    WHERE primary_track_id = track_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to unlink all variations of a track
CREATE OR REPLACE FUNCTION unlink_all_variations(track_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks 
  SET primary_track_id = NULL 
  WHERE primary_track_id = track_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_variation_count TO authenticated;
GRANT EXECUTE ON FUNCTION unlink_all_variations TO authenticated;

-- Verify the migration
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) FILTER (WHERE primary_track_id IS NOT NULL) as variation_tracks,
  COUNT(*) FILTER (WHERE primary_track_id IS NULL) as primary_tracks
FROM tracks;