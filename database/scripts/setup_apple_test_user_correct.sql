-- Setup script for Apple App Review test user
-- Updated to match the actual database schema

DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'apple.review@coretet.test';
    sample_playlist_id UUID;
    track1_id UUID;
    track2_id UUID;
    track3_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Please create the user first in Supabase Auth with email: % and password: AppleTest2025!', test_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', test_user_id;
    
    -- Step 1: Create or update the profile
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
    
    RAISE NOTICE '✓ Profile created/updated';
    
    -- Step 2: Create sample tracks
    -- Track 1: Loop
    INSERT INTO public.tracks (
        id,
        user_id,
        name,
        file_name,
        file_size,
        storage_path,
        duration,
        category,
        tags,
        artist,
        collection,
        tempo,
        key,
        listened,
        liked,
        loved,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_user_id,
        'Sample Track 1 - Ambient Loop',
        'sample1_ambient_loop.mp3',
        2048000, -- ~2MB
        'tracks/' || test_user_id || '/sample1_ambient_loop.mp3',
        180.0,
        'demos',
        ARRAY['test', 'ambient', 'loop'],
        'Test Artist',
        'Test Collection',
        120,
        'C',
        false,
        false,
        false,
        NOW(),
        NOW()
    ) RETURNING id INTO track1_id;
    
    -- Track 2: Song
    INSERT INTO public.tracks (
        id,
        user_id,
        name,
        file_name,
        file_size,
        storage_path,
        duration,
        category,
        tags,
        artist,
        collection,
        tempo,
        key,
        listened,
        liked,
        loved,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_user_id,
        'Sample Track 2 - Beat Demo',
        'sample2_beat_demo.mp3',
        3072000, -- ~3MB
        'tracks/' || test_user_id || '/sample2_beat_demo.mp3',
        240.0,
        'songs',
        ARRAY['test', 'beat', 'demo'],
        'Demo Producer',
        'Demo Beats',
        140,
        'G',
        true,
        true,
        false,
        NOW(),
        NOW()
    ) RETURNING id INTO track2_id;
    
    -- Track 3: Voice Memo
    INSERT INTO public.tracks (
        id,
        user_id,
        name,
        file_name,
        file_size,
        storage_path,
        duration,
        category,
        tags,
        artist,
        collection,
        tempo,
        key,
        listened,
        liked,
        loved,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_user_id,
        'Sample Track 3 - Voice Memo',
        'sample3_voice_memo.mp3',
        512000, -- ~0.5MB
        'tracks/' || test_user_id || '/sample3_voice_memo.mp3',
        30.0,
        'voice-memos',
        ARRAY['test', 'voice', 'memo'],
        'Sound Designer',
        'Voice Notes',
        NULL,
        NULL,
        true,
        false,
        false,
        NOW(),
        NOW()
    ) RETURNING id INTO track3_id;
    
    RAISE NOTICE '✓ Sample tracks created (3 tracks)';
    
    -- Step 3: Create a sample playlist
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
        'Sample playlist for app review testing with various track types',
        NOW(),
        NOW()
    ) RETURNING id INTO sample_playlist_id;
    
    RAISE NOTICE '✓ Playlist created: Apple Review Test Playlist';
    
    -- Step 4: Add tracks to the playlist
    -- First check if added_by column exists
    BEGIN
        INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_at, added_by)
        VALUES 
            (sample_playlist_id, track1_id, 0, NOW(), test_user_id),
            (sample_playlist_id, track2_id, 1, NOW(), test_user_id),
            (sample_playlist_id, track3_id, 2, NOW(), test_user_id);
    EXCEPTION
        WHEN undefined_column THEN
            -- If added_by doesn't exist, insert without it
            INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_at)
            VALUES 
                (sample_playlist_id, track1_id, 0, NOW()),
                (sample_playlist_id, track2_id, 1, NOW()),
                (sample_playlist_id, track3_id, 2, NOW());
    END;
    
    RAISE NOTICE '✓ Tracks added to playlist';
    
    -- Step 5: Create sample tasks (if tasks table exists)
    BEGIN
        -- Check if track_id column exists in tasks table
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'track_id'
        ) THEN
            -- Create task with track reference
            INSERT INTO public.tasks (
                id,
                user_id,
                track_id,
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
                track1_id,
                'Review Ambient Loop',
                'Check the ambient loop sample track and test playback.',
                'general',
                'medium',
                'pending',
                ARRAY['test', 'review'],
                NOW(),
                NOW()
            );
        ELSE
            -- Create task without track reference
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
        END IF;
        
        -- Add a second general task
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
            'Test Audio Upload',
            'Try uploading a new audio file to test the upload functionality.',
            'general',
            'low',
            'pending',
            ARRAY['test', 'upload'],
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✓ Sample tasks created (2 tasks)';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠ Tasks table not found, skipping task creation';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠ Could not create tasks: %', SQLERRM;
    END;
    
    -- Step 6: Add sample collection track order (if table exists)
    BEGIN
        INSERT INTO public.collection_track_order (
            user_id,
            collection_name,
            track_id,
            position
        ) VALUES 
            (test_user_id, 'Test Collection', track1_id, 0),
            (test_user_id, 'Demo Beats', track2_id, 0),
            (test_user_id, 'Voice Notes', track3_id, 0);
        RAISE NOTICE '✓ Collection ordering set up';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠ Collection track order table not found, skipping';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠ Could not set collection order: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Test user setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Test User Credentials:';
    RAISE NOTICE '  Email: %', test_email;
    RAISE NOTICE '  Password: AppleTest2025!';
    RAISE NOTICE '';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Created Data:';
    RAISE NOTICE '  - 3 sample tracks (songs, demos, voice-memos)';
    RAISE NOTICE '  - 1 test playlist with all tracks';
    RAISE NOTICE '  - Sample tasks (if table exists)';
    RAISE NOTICE '  - Collection ordering (if table exists)';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: The tracks reference storage paths but actual audio files';
    RAISE NOTICE 'would need to be uploaded to Supabase Storage for playback.';
    RAISE NOTICE 'For testing purposes, the app should handle missing files gracefully.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ Error occurred: %', SQLERRM;
        RAISE NOTICE 'Please check the error message above and try again.';
        RAISE;
END $$;

-- Verification query - check what was created
SELECT 
    p.id,
    p.email,
    p.is_active,
    ROUND(p.storage_limit / 1073741824.0, 1) as storage_limit_gb,
    (SELECT COUNT(*) FROM tracks WHERE user_id = p.id AND deleted_at IS NULL) as track_count,
    (SELECT COUNT(*) FROM playlists WHERE user_id = p.id) as playlist_count,
    (SELECT COUNT(*) FROM tasks WHERE user_id = p.id) as task_count,
    (SELECT COUNT(DISTINCT collection) FROM tracks WHERE user_id = p.id AND collection IS NOT NULL) as collection_count
FROM profiles p
WHERE p.email = 'apple.review@coretet.test';