-- Add username field to profiles table for better display names
-- Apply this migration in Supabase SQL Editor

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username TEXT;
    RAISE NOTICE 'Added username column to profiles table';
  ELSE
    RAISE NOTICE 'Username column already exists';
  END IF;
END $$;

-- Add display_name column for full name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
    RAISE NOTICE 'Added display_name column to profiles table';
  ELSE
    RAISE NOTICE 'Display_name column already exists';
  END IF;
END $$;

-- Add avatar_url column for profile pictures if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'Added avatar_url column to profiles table';
  ELSE
    RAISE NOTICE 'Avatar_url column already exists';
  END IF;
END $$;

-- Set default usernames from email for existing users
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- Create unique index on username (case-insensitive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_username_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_profiles_username_unique 
    ON profiles(LOWER(username));
    RAISE NOTICE 'Created unique index on username';
  ELSE
    RAISE NOTICE 'Username unique index already exists';
  END IF;
END $$;

-- Add comments to document the fields
COMMENT ON COLUMN profiles.username IS 'Unique username for display in comments and shares';
COMMENT ON COLUMN profiles.display_name IS 'Full display name (optional)';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to profile picture (optional)';

-- Create a view for public profile info (safe to expose)
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  COALESCE(display_name, username, SPLIT_PART(email, '@', 1)) as display_name,
  username,
  avatar_url,
  created_at
FROM profiles
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Create RLS policy for the view
ALTER VIEW public_profiles SET (security_invoker = on);

COMMENT ON VIEW public_profiles IS 'Public profile information safe to share with other users';

-- Verification
DO $$
DECLARE
  col_count integer;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('username', 'display_name', 'avatar_url');
  
  RAISE NOTICE 'Profile enhancements complete. Added % new columns', col_count;
END $$;