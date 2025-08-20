-- Add metadata columns to tracks table
-- These were previously stored in the analysis JSON column which was dropped

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS tempo INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS time_signature TEXT;

-- Create indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_key ON tracks(key);
CREATE INDEX IF NOT EXISTS idx_tracks_mood ON tracks(mood);

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks' 
AND column_name IN ('tempo', 'key', 'mood', 'genre', 'notes', 'time_signature')
ORDER BY column_name;