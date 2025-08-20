-- Check the current schema of the profiles table
-- Run this FIRST to see what columns exist

-- Show all columns in the profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if username column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        RAISE NOTICE 'Username column EXISTS';
        
        -- Check for duplicates
        PERFORM 1 FROM (
            SELECT LOWER(username), COUNT(*) as cnt
            FROM profiles
            WHERE username IS NOT NULL
            GROUP BY LOWER(username)
            HAVING COUNT(*) > 1
            LIMIT 1
        ) dups;
        
        IF FOUND THEN
            RAISE NOTICE 'Found duplicate usernames - need to fix before creating unique index';
        ELSE
            RAISE NOTICE 'No duplicate usernames found';
        END IF;
    ELSE
        RAISE NOTICE 'Username column DOES NOT EXIST - need to add it first';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'display_name'
    ) THEN
        RAISE NOTICE 'Display_name column EXISTS';
    ELSE
        RAISE NOTICE 'Display_name column DOES NOT EXIST';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        RAISE NOTICE 'Avatar_url column EXISTS';
    ELSE
        RAISE NOTICE 'Avatar_url column DOES NOT EXIST';
    END IF;
END $$;

-- Show existing indexes on profiles table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles';

-- Show sample data from profiles
SELECT 
    id,
    email,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'username'
        ) THEN 'Check username column in separate query'
        ELSE 'Username column does not exist'
    END as username_status,
    created_at
FROM profiles
LIMIT 5;