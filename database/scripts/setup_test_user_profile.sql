-- Setup profile and sample data for the Apple test user
-- Run this after creating the user in Supabase Auth

-- First, get the user ID
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'apple.review@coretet.test';
    sample_playlist_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Please create the user first with email: %', test_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', test_user_id;
    
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
        storage_limit = 5368709120,
        email = test_email;
    
    RAISE NOTICE 'Profile created/updated';
    
    -- Grant user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (test_user_id, 'user')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'user';
    
    RAISE NOTICE 'User role granted';
    
    -- Create a sample playlist
    INSERT INTO public.playlists (
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_user_id,
        'Apple Review Test Playlist',
        'Sample playlist for app review testing',
        NOW(),
        NOW()
    )
    RETURNING id INTO sample_playlist_id;
    
    RAISE NOTICE 'Playlist created with ID: %', sample_playlist_id;
    
    -- Create sample tracks with the playlist ID
    WITH inserted_tracks AS (
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
            gen_random_uuid(),
            test_user_id,
            'Sample Track 1 - Ambient Loop',
            'Test Artist',
            'Test Collection',
            'loops',
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            180,
            '120',
            'C',
            ARRAY['test', 'ambient', 'loop'],
            false,
            false,
            false,
            NOW(),
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            test_user_id,
            'Sample Track 2 - Beat Demo',
            'Demo Producer',
            'Demo Beats',
            'songs',
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            240,
            '140',
            'G',
            ARRAY['test', 'beat', 'demo'],
            true,
            true,
            false,
            NOW(),
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            test_user_id,
            'Sample Track 3 - One Shot',
            'Sound Designer',
            'SFX Pack',
            'oneshots',
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            30,
            NULL,
            NULL,
            ARRAY['test', 'oneshot', 'sfx'],
            true,
            false,
            false,
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id
    )
    -- Add tracks to the playlist
    INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_at)
    SELECT 
        sample_playlist_id,
        id,
        ROW_NUMBER() OVER (ORDER BY id) - 1,
        NOW()
    FROM inserted_tracks;
    
    RAISE NOTICE 'Sample tracks created and added to playlist';
    
    -- Create a sample task for the user
    INSERT INTO public.tasks (
        id,
        user_id,
        title,
        description,
        category,
        priority,
        status,
        tags,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_user_id,
        'Welcome to CoreTet!',
        'Explore the app features: upload tracks, create playlists, and organize your music.',
        'general',
        'medium',
        'pending',
        ARRAY['welcome', 'tutorial'],
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Sample task created';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test user setup completed successfully!';
    RAISE NOTICE 'Email: %', test_email;
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE '========================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        RAISE;
END $$;

-- Verify the setup
SELECT 
    p.id,
    p.email,
    p.is_active,
    p.storage_limit / 1073741824.0 as storage_limit_gb,
    ur.role,
    (SELECT COUNT(*) FROM tracks WHERE user_id = p.id) as track_count,
    (SELECT COUNT(*) FROM playlists WHERE user_id = p.id) as playlist_count,
    (SELECT COUNT(*) FROM tasks WHERE user_id = p.id) as task_count
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'apple.review@coretet.test';