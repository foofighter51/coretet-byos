-- Fix missing columns in profiles table
-- Run this in Supabase SQL editor

-- 1. First check which columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Add is_active column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add storage columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 5368709120; -- 5GB in bytes

-- 4. Set defaults for existing NULL values
UPDATE profiles 
SET is_active = true 
WHERE is_active IS NULL;

UPDATE profiles 
SET storage_used = 0 
WHERE storage_used IS NULL;

UPDATE profiles 
SET storage_limit = 5368709120 
WHERE storage_limit IS NULL;

-- 5. Make columns NOT NULL after setting defaults
ALTER TABLE profiles 
ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE profiles 
ALTER COLUMN storage_used SET NOT NULL;

ALTER TABLE profiles 
ALTER COLUMN storage_limit SET NOT NULL;

-- 6. Add comments for clarity
COMMENT ON COLUMN profiles.is_active IS 'Whether the user account is active and can access the application';
COMMENT ON COLUMN profiles.storage_used IS 'Storage used by user in bytes';
COMMENT ON COLUMN profiles.storage_limit IS 'Storage limit for user in bytes (default 5GB)';

-- 7. Calculate actual storage used per user based on their tracks
UPDATE profiles p
SET storage_used = COALESCE((
  SELECT SUM(file_size)
  FROM tracks t
  WHERE t.user_id = p.id
    AND t.deleted_at IS NULL
), 0);

-- 8. Verify the columns were added and data looks correct
SELECT 
  email,
  is_active,
  storage_used,
  storage_limit,
  ROUND(storage_used::numeric / 1024 / 1024, 2) as used_mb,
  ROUND(storage_limit::numeric / 1024 / 1024, 2) as limit_mb,
  ROUND((storage_used::numeric / storage_limit::numeric) * 100, 2) as percent_used
FROM profiles
ORDER BY created_at DESC;

-- 9. Grant necessary permissions
GRANT SELECT(is_active, storage_used, storage_limit) ON profiles TO authenticated;
GRANT UPDATE(is_active) ON profiles TO authenticated;