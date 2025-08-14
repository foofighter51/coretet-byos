-- Add artist and collection fields to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS artist TEXT,
ADD COLUMN IF NOT EXISTS collection TEXT;

-- Note: s3_key was already renamed to storage_path in a previous migration