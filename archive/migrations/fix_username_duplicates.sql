-- Fix duplicate usernames before creating unique index
-- Apply this migration in Supabase SQL Editor

-- First, check for duplicates
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT LOWER(username), COUNT(*) as cnt
    FROM profiles
    WHERE username IS NOT NULL
    GROUP BY LOWER(username)
    HAVING COUNT(*) > 1
  ) dups;
  
  RAISE NOTICE 'Found % duplicate username(s)', dup_count;
END $$;

-- Fix duplicates by appending numbers to duplicate usernames
WITH duplicates AS (
  SELECT 
    id,
    username,
    LOWER(username) as lower_username,
    ROW_NUMBER() OVER (PARTITION BY LOWER(username) ORDER BY created_at, id) as rn
  FROM profiles
  WHERE username IS NOT NULL
)
UPDATE profiles p
SET username = d.username || '_' || d.rn
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;

-- Also handle any NULL usernames that might exist
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1) || '_' || SUBSTRING(id::text, 1, 4)
WHERE username IS NULL;

-- Now check if we still have duplicates after the fix
DO $$
DECLARE
  remaining_dups integer;
BEGIN
  SELECT COUNT(*) INTO remaining_dups
  FROM (
    SELECT LOWER(username), COUNT(*) as cnt
    FROM profiles
    WHERE username IS NOT NULL
    GROUP BY LOWER(username)
    HAVING COUNT(*) > 1
  ) dups;
  
  IF remaining_dups > 0 THEN
    RAISE NOTICE 'Warning: Still have % duplicate(s) after fix', remaining_dups;
    
    -- More aggressive fix - append UUID substring
    UPDATE profiles p1
    SET username = username || '_' || SUBSTRING(id::text, 1, 8)
    WHERE EXISTS (
      SELECT 1 FROM profiles p2
      WHERE LOWER(p2.username) = LOWER(p1.username)
      AND p2.id != p1.id
    );
  ELSE
    RAISE NOTICE 'All duplicates resolved successfully';
  END IF;
END $$;

-- Drop the old index if it exists (it might have been partially created)
DROP INDEX IF EXISTS idx_profiles_username_unique;

-- Now create the unique index
DO $$
DECLARE
  rec record;
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
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Still have duplicates - appending more unique suffixes';
    
    -- Final fallback - make all usernames unique with timestamp
    UPDATE profiles
    SET username = username || '_' || EXTRACT(EPOCH FROM NOW())::integer || '_' || SUBSTRING(id::text, 1, 4)
    WHERE username IN (
      SELECT username FROM profiles
      GROUP BY LOWER(username)
      HAVING COUNT(*) > 1
    );
    
    -- Try creating index again
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
    ON profiles(LOWER(username));
END $$;

-- Verify the fix
DO $$
DECLARE
  total_users integer;
  unique_usernames integer;
  rec record;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(DISTINCT LOWER(username)) INTO unique_usernames FROM profiles WHERE username IS NOT NULL;
  
  RAISE NOTICE 'Total profiles: %, Unique usernames: %', total_users, unique_usernames;
  
  -- Show a sample of the usernames
  FOR rec IN 
    SELECT username, email 
    FROM profiles 
    ORDER BY created_at DESC 
    LIMIT 5
  LOOP
    RAISE NOTICE 'Sample: % (%)', rec.username, rec.email;
  END LOOP;
END $$;

-- Add comments
COMMENT ON COLUMN profiles.username IS 'Unique username for display (case-insensitive)';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE 'Username duplicates fixed and unique index created successfully!';
END $$;