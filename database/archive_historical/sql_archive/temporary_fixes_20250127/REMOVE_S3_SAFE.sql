-- REMOVE ALL S3 REFERENCES - SAFE VERSION
-- This script safely removes all AWS/S3 references from the database
-- It checks for column existence before trying to access it

-- =====================================================
-- STEP 1: DATABASE SCHEMA FIXES
-- =====================================================

SELECT '=== FIXING DATABASE SCHEMA ===' as step;

-- 1.1 Add storage_path column if missing
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 1.2 Check if s3_key exists and copy data if it does
DO $$
BEGIN
    -- Check if s3_key column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tracks' 
        AND column_name = 's3_key'
    ) THEN
        -- Copy s3_key data to storage_path
        UPDATE tracks
        SET storage_path = s3_key
        WHERE storage_path IS NULL 
        AND s3_key IS NOT NULL;
        
        -- Drop the s3_key column
        ALTER TABLE tracks DROP COLUMN s3_key;
        RAISE NOTICE 'Migrated s3_key to storage_path and dropped s3_key column';
    ELSE
        RAISE NOTICE 'Column s3_key does not exist - skipping migration';
    END IF;
END $$;

-- =====================================================
-- STEP 2: FIX RLS POLICIES
-- =====================================================

SELECT '=== FIXING RLS POLICIES ===' as step;

-- Drop all existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
    RAISE NOTICE 'Dropped all existing policies';
END $$;

-- Create clean policies without S3 references
CREATE POLICY "tracks_owner_policy" ON tracks
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlists_owner_policy" ON playlists
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "playlist_tracks_owner_policy" ON playlist_tracks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p 
            WHERE p.id = playlist_tracks.playlist_id 
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists p 
            WHERE p.id = playlist_tracks.playlist_id 
            AND p.user_id = auth.uid()
        )
    );

-- Only create playlist_shares policy if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'playlist_shares'
    ) THEN
        CREATE POLICY "playlist_shares_owner_policy" ON playlist_shares
            FOR ALL TO authenticated
            USING (shared_by = auth.uid())
            WITH CHECK (shared_by = auth.uid());
        RAISE NOTICE 'Created playlist_shares policy';
    ELSE
        RAISE NOTICE 'Table playlist_shares does not exist - skipping policy';
    END IF;
END $$;

-- =====================================================
-- STEP 3: ENSURE SUPABASE STORAGE IS CONFIGURED
-- =====================================================

SELECT '=== CONFIGURING SUPABASE STORAGE ===' as step;

-- Ensure audio-files bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files', 
    false, -- private bucket
    104857600, -- 100MB limit
    ARRAY['audio/mpeg', 'audio/mp4', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/flac']::text[]
)
ON CONFLICT (id) 
DO UPDATE SET
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp4', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/flac']::text[];

-- Simple storage policies
DROP POLICY IF EXISTS "Users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete audio files" ON storage.objects;

-- Allow authenticated users to manage their own files
CREATE POLICY "Authenticated users can upload audio" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Authenticated users can view audio" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Authenticated users can update audio" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Authenticated users can delete audio" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- STEP 4: UPDATE STORAGE PATHS TO SUPABASE FORMAT
-- =====================================================

SELECT '=== UPDATING STORAGE PATHS ===' as step;

-- Ensure all storage paths follow Supabase format: user_id/track_id/filename
UPDATE tracks
SET storage_path = user_id || '/' || id || '/' || file_name
WHERE storage_path IS NOT NULL
AND storage_path !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/'
AND file_name IS NOT NULL;

-- Handle any NULL storage_paths
UPDATE tracks
SET storage_path = user_id || '/' || id || '/' || file_name
WHERE storage_path IS NULL
AND file_name IS NOT NULL;

-- =====================================================
-- STEP 5: VERIFY CLEANUP
-- =====================================================

SELECT '=== VERIFICATION ===' as step;

-- Check storage_path data
SELECT 
    COUNT(*) as total_tracks,
    COUNT(storage_path) as tracks_with_storage_path,
    COUNT(CASE WHEN storage_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/' THEN 1 END) as correct_format_paths,
    COUNT(CASE WHEN storage_path IS NULL THEN 1 END) as null_storage_paths
FROM tracks;

-- Sample tracks (no auth filter for admin view)
SELECT 
    id,
    user_id,
    name,
    file_name,
    storage_path,
    created_at
FROM tracks
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 6: FINAL STATUS
-- =====================================================

SELECT 
    E'\n✅ S3 CLEANUP COMPLETE!\n\n' ||
    'Database changes:\n' ||
    '• storage_path column is now the standard\n' ||
    '• s3_key column removed (if it existed)\n' ||
    '• Storage paths formatted for Supabase\n' ||
    '• RLS policies cleaned up\n' ||
    '• Storage bucket configured\n\n' ||
    'Next steps:\n' ||
    '1. Deploy the updated edge function\n' ||
    '2. Remove AWS environment variables\n' ||
    '3. Test file uploads and playback' as summary;