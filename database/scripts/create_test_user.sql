-- Script to create a test user for Apple App Review
-- This user will have predetermined credentials for testing purposes

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the test user in auth.users
-- Email: apple.review@coretet.test
-- Password: AppleTest2025!
-- Note: You'll need to create this user through Supabase Auth Admin or use the Dashboard

-- After creating the user in Auth, run this to set up their profile:

-- Insert profile for the test user (replace the UUID with the actual user ID from auth.users)
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'apple.review@coretet.test';
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
    
    IF test_user_id IS NOT NULL THEN
        -- Insert or update the profile
        INSERT INTO public.profiles (
            id,
            email,
            storage_used,
            storage_limit,
            is_active,
            invited_by,
            created_at
        ) VALUES (
            test_user_id,
            test_email,
            0,
            5368709120, -- 5GB storage limit
            true,
            NULL, -- No invite needed for test user
            NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            is_active = true,
            storage_limit = 5368709120;
        
        -- Grant user role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (test_user_id, 'user')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Create a sample playlist for the test user
        INSERT INTO public.playlists (
            id,
            user_id,
            name,
            description,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            test_user_id,
            'Apple Review Test Playlist',
            'Sample playlist for app review testing',
            NOW(),
            NOW()
        );
        
        -- Add some sample tracks (you may need to adjust this based on your track structure)
        INSERT INTO public.tracks (
            id,
            user_id,
            name,
            artist,
            collection,
            category,
            url,
            duration,
            tempo,
            key,
            tags,
            listened,
            liked,
            loved,
            created_at,
            updated_at,
            uploadedAt
        ) VALUES 
        (
            uuid_generate_v4(),
            test_user_id,
            'Sample Track 1',
            'Test Artist',
            'Test Album',
            'songs',
            'https://example.com/track1.mp3', -- You'll need to provide actual test audio URLs
            180,
            120,
            'C',
            ARRAY['test', 'sample'],
            false,
            false,
            false,
            NOW(),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            test_user_id,
            'Sample Track 2',
            'Test Artist',
            'Test Album',
            'loops',
            'https://example.com/track2.mp3',
            90,
            140,
            'G',
            ARRAY['test', 'loop'],
            false,
            false,
            false,
            NOW(),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            test_user_id,
            'Sample Track 3',
            'Demo Artist',
            'Demo Collection',
            'oneshots',
            'https://example.com/track3.mp3',
            30,
            NULL,
            NULL,
            ARRAY['demo', 'oneshot'],
            true,
            true,
            false,
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Test user setup completed for: %', test_email;
    ELSE
        RAISE NOTICE 'User not found. Please create the user first through Supabase Auth with email: % and password: AppleTest2025!', test_email;
    END IF;
END $$;

-- Query to verify the test user was created successfully
SELECT 
    p.id,
    p.email,
    p.is_active,
    p.storage_limit,
    ur.role,
    (SELECT COUNT(*) FROM tracks WHERE user_id = p.id) as track_count,
    (SELECT COUNT(*) FROM playlists WHERE user_id = p.id) as playlist_count
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'apple.review@coretet.test';