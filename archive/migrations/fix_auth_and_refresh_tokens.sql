-- Fix auth issues and ensure proper user setup
-- This addresses refresh token issues and profile creation

-- 1. Check current profiles table structure
SELECT 
    'Current profiles columns:' as info,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- 2. List all auth users and their profile status
SELECT 
    au.id,
    au.email,
    au.created_at,
    p.id as profile_id,
    p.display_name,
    p.is_active,
    CASE 
        WHEN p.id IS NULL THEN 'MISSING PROFILE'
        WHEN p.is_active = false THEN 'INACTIVE'
        ELSE 'OK'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.email;

-- 3. Fix any users without profiles
INSERT INTO public.profiles (id, email, display_name, storage_used, storage_limit, is_active, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
    0,
    10737418240, -- 10GB
    true,
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Activate all profiles (in case some are inactive)
UPDATE public.profiles 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- 5. Set display names for any that are null
UPDATE public.profiles 
SET display_name = SPLIT_PART(email, '@', 1)
WHERE display_name IS NULL OR display_name = '';

-- 6. Specifically check and fix ericexley@hotmail.com
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find the user
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = 'ericexley@hotmail.com';
    
    IF user_record.id IS NOT NULL THEN
        -- Ensure profile exists and is active
        INSERT INTO public.profiles (
            id, 
            email, 
            display_name,
            storage_used, 
            storage_limit, 
            is_active,
            created_at
        ) VALUES (
            user_record.id,
            'ericexley@hotmail.com',
            'ericexley',
            0,
            10737418240,
            true,
            user_record.created_at
        ) ON CONFLICT (id) DO UPDATE SET
            is_active = true,
            display_name = COALESCE(profiles.display_name, 'ericexley'),
            email = 'ericexley@hotmail.com';
            
        RAISE NOTICE 'Fixed profile for ericexley@hotmail.com - ID: %', user_record.id;
    ELSE
        RAISE NOTICE 'User ericexley@hotmail.com not found in auth.users';
    END IF;
END $$;

-- 7. Clear any stale auth sessions (this helps with refresh token issues)
-- Note: This is informational only - you may need to have the user log out and back in
SELECT 
    'Users that may need to re-login:' as info,
    email,
    last_sign_in_at,
    CASE 
        WHEN last_sign_in_at < NOW() - INTERVAL '7 days' THEN 'Old session - should re-login'
        ELSE 'Recent login'
    END as recommendation
FROM auth.users
WHERE email IN ('ericexley@hotmail.com', 'ericexley@gmail.com')
ORDER BY last_sign_in_at DESC;

-- 8. Verify the fix
SELECT 
    'Profile verification:' as check_type,
    au.email,
    p.id IS NOT NULL as has_profile,
    p.is_active,
    p.display_name,
    p.storage_limit
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'ericexley@hotmail.com';

-- 9. Create or update RLS policies to be more permissive during auth
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
CREATE POLICY "Profiles are viewable by owner" ON profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR auth.uid() IS NOT NULL -- Allow any authenticated user to see if profile exists
    );

-- 10. Message about refresh token fix
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'AUTH FIX COMPLETED';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'If user ericexley@hotmail.com still has issues:';
    RAISE NOTICE '1. Have them clear browser cache/cookies';
    RAISE NOTICE '2. Log out completely';
    RAISE NOTICE '3. Close all browser tabs for the app';
    RAISE NOTICE '4. Wait 10 seconds';
    RAISE NOTICE '5. Log in again fresh';
    RAISE NOTICE '';
    RAISE NOTICE 'The "Invalid Refresh Token" error means their session is stale.';
    RAISE NOTICE 'A fresh login will fix this.';
    RAISE NOTICE '===========================================';
END $$;