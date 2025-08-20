-- STORAGE CHOICE FIX
-- Choose your storage solution and apply the appropriate fix

-- =====================================================
-- FIRST: CHECK YOUR CURRENT SITUATION
-- =====================================================

-- 1. Check what columns exist
SELECT 
    '=== CURRENT COLUMNS ===' as check,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tracks'
AND column_name IN ('s3_key', 'storage_path', 'file_path')
ORDER BY column_name;

-- 2. Check sample data
SELECT 
    '=== SAMPLE DATA ===' as check,
    id,
    name,
    file_name,
    s3_key,
    substring(s3_key, 1, 50) as s3_key_preview,
    created_at
FROM tracks
WHERE user_id = auth.uid()
LIMIT 5;

-- 3. Check if you have S3 environment variables configured
SELECT 
    '=== S3 CONFIGURATION ===' as check,
    'Check your Supabase Edge Function environment variables for:' as note,
    'AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET' as required_vars;

-- 4. Check if files exist in Supabase Storage
SELECT 
    '=== SUPABASE STORAGE ===' as check,
    COUNT(*) as files_in_supabase_storage
FROM storage.objects
WHERE bucket_id = 'audio-files';

-- =====================================================
-- OPTION A: USE AWS S3 (Recommended for scale)
-- =====================================================

/*
Run this section if you want to use S3:

-- A1. Simple column rename (minimal change)
ALTER TABLE tracks 
RENAME COLUMN s3_key TO storage_path;

-- A2. Ensure your edge function environment has:
-- AWS_REGION=us-east-1 (or your region)
-- AWS_ACCESS_KEY_ID=your-key
-- AWS_SECRET_ACCESS_KEY=your-secret
-- AWS_S3_BUCKET=your-bucket-name

-- A3. Update TypeScript types (manually in code):
-- In src/lib/supabase.ts, change s3_key to storage_path

-- A4. Configure S3 bucket for public read access or signed URLs

-- A5. Update frontend to use edge function for uploads
-- The edge function already handles S3 uploads correctly
*/

-- =====================================================
-- OPTION B: USE SUPABASE STORAGE (Simpler setup)
-- =====================================================

/*
Run this section if you want to use Supabase Storage:
*/

-- B1. Add storage_path column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tracks' 
        AND column_name = 'storage_path'
    ) THEN
        ALTER TABLE tracks ADD COLUMN storage_path TEXT;
        RAISE NOTICE 'Added storage_path column';
    END IF;
END $$;

-- B2. Copy s3_key to storage_path and format for Supabase
UPDATE tracks
SET storage_path = 
    CASE 
        WHEN s3_key LIKE '%/%/%' THEN s3_key  -- Already has folder structure
        WHEN s3_key LIKE '%/%' THEN user_id || '/' || s3_key  -- Has one folder
        ELSE user_id || '/' || id || '/' || file_name  -- Just filename
    END
WHERE storage_path IS NULL 
AND s3_key IS NOT NULL;

-- B3. Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', false)
ON CONFLICT (id) DO NOTHING;

-- B4. Simple storage policies
DROP POLICY IF EXISTS "Enable storage for authenticated users" ON storage.objects;
CREATE POLICY "Enable storage for authenticated users" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'audio-files')
WITH CHECK (bucket_id = 'audio-files');

-- =====================================================
-- VERIFY YOUR CHOICE
-- =====================================================

-- Show the result
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tracks' AND column_name = 'storage_path')
        THEN 'storage_path column exists - ready for either S3 or Supabase'
        ELSE 's3_key column only - need to run migration'
    END as status,
    COUNT(*) as total_tracks,
    COUNT(CASE WHEN s3_key IS NOT NULL THEN 1 END) as tracks_with_s3_key,
    COUNT(CASE WHEN storage_path IS NOT NULL THEN 1 END) as tracks_with_storage_path
FROM tracks
WHERE user_id = auth.uid();

-- =====================================================
-- NEXT STEPS BASED ON YOUR CHOICE
-- =====================================================

SELECT 
    E'\n=== NEXT STEPS ===\n\n' ||
    'For S3:\n' ||
    '1. Run section A to rename column\n' ||
    '2. Configure AWS credentials in Supabase\n' ||
    '3. Update TypeScript types\n' ||
    '4. Frontend already uploads via edge function\n\n' ||
    'For Supabase Storage:\n' ||
    '1. Run section B to add storage_path\n' ||
    '2. Upload files to Supabase if not there\n' ||
    '3. Frontend already handles Supabase uploads\n' ||
    '4. Simpler but check storage limits' as instructions;