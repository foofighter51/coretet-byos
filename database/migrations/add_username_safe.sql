-- Safe migration to add username columns and handle duplicates
-- Run this instead of the previous migrations

-- STEP 1: Add columns if they don't exist
DO $$
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE profiles ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column';
    ELSE
        RAISE NOTICE 'Username column already exists';
    END IF;
    
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN display_name TEXT;
        RAISE NOTICE 'Added display_name column';
    ELSE
        RAISE NOTICE 'Display_name column already exists';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column';
    ELSE
        RAISE NOTICE 'Avatar_url column already exists';
    END IF;
END $$;

-- STEP 2: Set initial usernames from email if NULL
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- STEP 3: Fix any duplicates by appending numbers
WITH duplicates AS (
    SELECT 
        id,
        username,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(username) 
            ORDER BY created_at, id
        ) as rn
    FROM profiles
    WHERE username IS NOT NULL
)
UPDATE profiles p
SET username = 
    CASE 
        WHEN d.rn = 1 THEN d.username
        ELSE d.username || '_' || d.rn
    END
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;

-- STEP 4: Handle any remaining duplicates with UUID
DO $$
DECLARE
    dup_count integer;
BEGIN
    -- Check for remaining duplicates
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT LOWER(username), COUNT(*) as cnt
        FROM profiles
        WHERE username IS NOT NULL
        GROUP BY LOWER(username)
        HAVING COUNT(*) > 1
    ) dups;
    
    IF dup_count > 0 THEN
        RAISE NOTICE 'Found % remaining duplicates, fixing with UUID suffix', dup_count;
        
        -- Add UUID suffix to any remaining duplicates
        UPDATE profiles p1
        SET username = username || '_' || SUBSTRING(id::text, 1, 8)
        WHERE EXISTS (
            SELECT 1 
            FROM profiles p2
            WHERE LOWER(p2.username) = LOWER(p1.username)
              AND p2.id != p1.id
        );
    ELSE
        RAISE NOTICE 'No duplicate usernames found';
    END IF;
END $$;

-- STEP 5: Create unique index if it doesn't exist
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
        RAISE NOTICE 'Unique index already exists';
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique violation - fixing final duplicates';
        
        -- Emergency fix - add timestamp to make unique
        UPDATE profiles
        SET username = username || '_' || EXTRACT(EPOCH FROM NOW())::integer::text
        WHERE username IN (
            SELECT username 
            FROM profiles
            GROUP BY LOWER(username)
            HAVING COUNT(*) > 1
        );
        
        -- Try again
        CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
        ON profiles(LOWER(username));
END $$;

-- STEP 6: Create public view if it doesn't exist
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
    id,
    COALESCE(display_name, username, SPLIT_PART(email, '@', 1)) as display_name,
    username,
    avatar_url,
    created_at
FROM profiles
WHERE is_active = true;

-- Grant permissions
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Add comments
COMMENT ON COLUMN profiles.username IS 'Unique username for display in comments and shares';
COMMENT ON COLUMN profiles.display_name IS 'Full display name (optional)';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to profile picture (optional)';
COMMENT ON VIEW public_profiles IS 'Public profile information safe to share with other users';

-- STEP 7: Verify results
DO $$
DECLARE
    total_profiles integer;
    unique_usernames integer;
    sample record;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(DISTINCT LOWER(username)) INTO unique_usernames 
    FROM profiles WHERE username IS NOT NULL;
    
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'Total profiles: %', total_profiles;
    RAISE NOTICE 'Unique usernames: %', unique_usernames;
    
    -- Show sample usernames
    RAISE NOTICE '=== Sample Usernames ===';
    FOR sample IN 
        SELECT username, email 
        FROM profiles 
        WHERE username IS NOT NULL
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE '  % (from %)', sample.username, sample.email;
    END LOOP;
END $$;