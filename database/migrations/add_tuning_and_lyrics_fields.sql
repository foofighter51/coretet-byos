-- Add Tuning and Lyrics fields to tracks table
-- Created: 2025-08-12

-- Add tuning field for instrument tunings (e.g., "Drop D", "DADGAD", "Standard E")
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS tuning TEXT;

-- Add lyrics field for song lyrics
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS lyrics TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN tracks.tuning IS 'Instrument tuning used (e.g., Drop D, DADGAD, Open G)';
COMMENT ON COLUMN tracks.lyrics IS 'Song lyrics - editable only by track owner in playlists';