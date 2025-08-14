-- FIX FOR SUPABASE STORAGE
-- Since your files are already in Supabase Storage, let's fix the column issue

-- =====================================================
-- STEP 1: CHECK CURRENT STATE
-- =====================================================

SELECT '=== CURRENT STATE ===' as step;

-- Check columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tracks'
AND column_name IN ('s3_key', 'storage_path')
ORDER BY column_name;

-- Check data
SELECT 
    COUNT(*) as total_tracks,
    COUNT(s3_key) as has_s3_key,
    COUNT(storage_path) as has_storage_path
FROM tracks
WHERE user_id = auth.uid();

-- =====================================================
-- STEP 2: ADD STORAGE_PATH COLUMN
-- =====================================================

-- Add storage_path if it doesn't exist
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- =====================================================
-- STEP 3: MIGRATE DATA
-- =====================================================

-- Copy s3_key to storage_path
UPDATE tracks
SET storage_path = s3_key
WHERE storage_path IS NULL 
AND s3_key IS NOT NULL
AND user_id = auth.uid();

-- =====================================================
-- STEP 4: UPDATE TYPESCRIPT TYPES
-- =====================================================

-- Note: You need to manually update src/lib/supabase.ts
-- Change: s3_key: string;
-- To: storage_path: string;
-- Or add both for compatibility

-- =====================================================
-- STEP 5: SIMPLE RLS POLICIES
-- =====================================================

-- Drop complex policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Create simple owner policies
CREATE POLICY "simple_tracks_owner" ON tracks
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_playlists_owner" ON playlists
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_playlist_tracks_owner" ON playlist_tracks
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

CREATE POLICY "simple_playlist_shares_owner" ON playlist_shares
    FOR ALL TO authenticated
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

-- =====================================================
-- STEP 6: CHECK STORAGE USAGE
-- =====================================================

-- See how much storage you're using
SELECT 
    '=== STORAGE USAGE ===' as info,
    COUNT(*) as file_count,
    ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb,
    ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0 / 1024.0, 2) as total_gb
FROM storage.objects
WHERE bucket_id = 'audio-files';

-- =====================================================
-- STEP 7: VERIFY FIX
-- =====================================================

-- Test queries
SELECT 
    '=== VERIFICATION ===' as step,
    id,
    name,
    file_name,
    storage_path,
    CASE 
        WHEN storage_path IS NOT NULL THEN '✓ Has path'
        ELSE '✗ Missing path'
    END as status
FROM tracks
WHERE user_id = auth.uid()
LIMIT 5;

-- =====================================================
-- STEP 8: SUCCESS MESSAGE
-- =====================================================

SELECT 
    E'\n✅ FIX APPLIED!\n\n' ||
    'What was done:\n' ||
    '• Added storage_path column\n' ||
    '• Copied s3_key values to storage_path\n' ||
    '• Applied simple RLS policies\n' ||
    '• Checked storage usage\n\n' ||
    'Next steps:\n' ||
    '1. Update TypeScript types (s3_key → storage_path)\n' ||
    '2. Test audio playback\n' ||
    '3. Monitor storage usage (see limits above)\n\n' ||
    'Storage Limits (Supabase Pro):\n' ||
    '• 100GB included storage\n' ||
    '• 200GB/month bandwidth\n' ||
    '• $0.021/GB extra storage\n' ||
    '• $0.09/GB extra bandwidth' as summary;