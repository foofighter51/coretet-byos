-- REMOVE ALL S3 REFERENCES - DATABASE CLEANUP
-- This script removes all AWS/S3 references from the database

-- =====================================================
-- STEP 1: DATABASE SCHEMA FIXES
-- =====================================================

SELECT '=== FIXING DATABASE SCHEMA ===' as step;

-- 1.1 Add storage_path column if missing
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 1.2 Copy s3_key data to storage_path
UPDATE tracks
SET storage_path = s3_key
WHERE storage_path IS NULL 
AND s3_key IS NOT NULL;

-- 1.3 Drop the s3_key column (after confirming data is copied)
-- First, let's verify the data migration
DO $$
DECLARE
    s3_count INTEGER;
    storage_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO s3_count FROM tracks WHERE s3_key IS NOT NULL;
    SELECT COUNT(*) INTO storage_count FROM tracks WHERE storage_path IS NOT NULL;
    
    IF s3_count > 0 AND storage_count >= s3_count THEN
        -- Safe to drop s3_key column
        ALTER TABLE tracks DROP COLUMN IF EXISTS s3_key;
        RAISE NOTICE 'Dropped s3_key column - data migrated to storage_path';
    ELSE
        RAISE NOTICE 'WARNING: Not dropping s3_key yet - data migration incomplete';
        RAISE NOTICE 's3_key records: %, storage_path records: %', s3_count, storage_count;
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

CREATE POLICY "playlist_shares_owner_policy" ON playlist_shares
    FOR ALL TO authenticated
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

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

-- =====================================================
-- STEP 5: VERIFY CLEANUP
-- =====================================================

SELECT '=== VERIFICATION ===' as step;

-- Check if s3_key column still exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tracks' AND column_name = 's3_key'
        ) THEN 'WARNING: s3_key column still exists'
        ELSE '✓ s3_key column removed'
    END as s3_cleanup_status;

-- Check storage_path data
SELECT 
    COUNT(*) as total_tracks,
    COUNT(storage_path) as tracks_with_storage_path,
    COUNT(CASE WHEN storage_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/' THEN 1 END) as correct_format_paths
FROM tracks
WHERE user_id = auth.uid();

-- Sample tracks
SELECT 
    id,
    name,
    file_name,
    storage_path,
    created_at
FROM tracks
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 6: FINAL STATUS
-- =====================================================

SELECT 
    E'\n✅ S3 CLEANUP COMPLETE!\n\n' ||
    'Database changes:\n' ||
    '• storage_path column is now the standard\n' ||
    '• s3_key column removed (if migration complete)\n' ||
    '• Storage paths formatted for Supabase\n' ||
    '• RLS policies cleaned up\n' ||
    '• Storage bucket configured\n\n' ||
    'Next steps:\n' ||
    '1. Update TypeScript types (remove s3_key)\n' ||
    '2. Remove AWS SDK from edge functions\n' ||
    '3. Update frontend code\n' ||
    '4. Remove AWS environment variables' as summary;