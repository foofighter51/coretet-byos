-- Add soft delete functionality to tracks table
-- This allows tracks to be archived for 30 days before permanent deletion

-- Add deleted_at column to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tracks_deleted_at ON tracks(deleted_at);

-- Update RLS policies to hide deleted tracks by default
-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view their own tracks" ON tracks;

-- Create new select policy that excludes deleted tracks
CREATE POLICY "Users can view their own non-deleted tracks" 
ON tracks FOR SELECT 
USING (
  auth.uid() = user_id 
  AND deleted_at IS NULL
);

-- Create policy to allow viewing deleted tracks (for recovery UI)
CREATE POLICY "Users can view their own deleted tracks" 
ON tracks FOR SELECT 
USING (
  auth.uid() = user_id 
  AND deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '30 days'
);

-- Update the delete policy to set deleted_at instead of deleting
DROP POLICY IF EXISTS "Users can delete their own tracks" ON tracks;

-- Create soft delete policy
CREATE POLICY "Users can soft delete their own tracks" 
ON tracks FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND deleted_at IS NOT NULL
);

-- Create function to permanently delete old tracks
CREATE OR REPLACE FUNCTION delete_old_tracks()
RETURNS void AS $$
BEGIN
  -- Delete tracks that have been soft deleted for more than 30 days
  DELETE FROM tracks 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run daily (requires pg_cron extension)
-- Note: pg_cron must be enabled in Supabase dashboard
-- SELECT cron.schedule('delete-old-tracks', '0 2 * * *', 'SELECT delete_old_tracks();');

-- Create function to restore a deleted track
CREATE OR REPLACE FUNCTION restore_track(track_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks 
  SET deleted_at = NULL 
  WHERE id = track_id 
  AND user_id = auth.uid()
  AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION restore_track TO authenticated;

-- Create view for deleted tracks
CREATE OR REPLACE VIEW deleted_tracks AS
SELECT * FROM tracks
WHERE deleted_at IS NOT NULL
AND deleted_at > NOW() - INTERVAL '30 days';

-- Grant permissions on the view
GRANT SELECT ON deleted_tracks TO authenticated;

-- Add RLS to the view
ALTER VIEW deleted_tracks OWNER TO authenticated;

-- Update playlist_tracks to handle soft deleted tracks
-- When a track is soft deleted, it should be removed from playlists
CREATE OR REPLACE FUNCTION remove_deleted_tracks_from_playlists()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Track is being soft deleted, remove from all playlists
    DELETE FROM playlist_tracks 
    WHERE track_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS handle_track_soft_delete ON tracks;
CREATE TRIGGER handle_track_soft_delete
AFTER UPDATE OF deleted_at ON tracks
FOR EACH ROW
EXECUTE FUNCTION remove_deleted_tracks_from_playlists();

-- Update track_variations to handle soft deleted tracks
-- Prevent deletion of primary track if it has non-deleted variations
CREATE OR REPLACE FUNCTION check_variations_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Check if this track has any non-deleted variations
    IF EXISTS (
      SELECT 1 FROM tracks 
      WHERE primary_track_id = NEW.id 
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot delete primary track that has active variations';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_variations_before_delete ON tracks;
CREATE TRIGGER check_variations_before_delete
BEFORE UPDATE OF deleted_at ON tracks
FOR EACH ROW
EXECUTE FUNCTION check_variations_before_delete();

-- Verify the changes
SELECT 
  'Soft delete system ready' as status,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_tracks,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_tracks
FROM tracks;