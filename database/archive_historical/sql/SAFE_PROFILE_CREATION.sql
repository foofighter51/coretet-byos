-- SAFE PROFILE CREATION
-- This only creates profiles for users who are ALREADY authenticated
-- They must have used a valid invite code to get this far

-- 1. Check if the CURRENT authenticated user has a profile
SELECT 
    'Current Authenticated User' as section,
    auth.uid() as user_id,
    auth.email() as email,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ Not authenticated'
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN '✅ Profile exists'
        ELSE '⚠️ Authenticated but missing profile'
    END as status;

-- 2. Only create profile if user is authenticated but missing profile
DO $$
BEGIN
    -- Only proceed if we have an authenticated user
    IF auth.uid() IS NOT NULL THEN
        -- Create profile if it doesn't exist
        INSERT INTO profiles (id, email, created_at)
        VALUES (
            auth.uid(),
            auth.email(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Profile created/verified for user %', auth.uid();
    ELSE
        RAISE NOTICE 'No authenticated user - cannot create profile';
    END IF;
END $$;

-- 3. For the specific user having issues
-- Run this as an admin or in the Supabase dashboard
INSERT INTO profiles (id, email, created_at)
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE id = '86ded636-5c4c-4f4f-99bb-bcc7fa59ecf3'
    AND NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = '86ded636-5c4c-4f4f-99bb-bcc7fa59ecf3'
    );

-- 4. Verify the fix
SELECT 
    'Profile Check' as section,
    au.id,
    au.email as auth_email,
    p.email as profile_email,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.id = '86ded636-5c4c-4f4f-99bb-bcc7fa59ecf3';