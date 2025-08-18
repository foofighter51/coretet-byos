-- Remove Supabase Storage References for BYOS
-- This migration removes all references to Supabase storage since BYOS focuses on external cloud providers

-- Remove existing supabase storage provider records
DELETE FROM user_storage_providers WHERE provider = 'supabase';

-- Update tracks table to remove s3_key references (no longer needed for BYOS)
-- Keep storage_path for cloud provider file paths
UPDATE tracks SET s3_key = NULL WHERE s3_key IS NOT NULL;

-- Update storage provider check constraint to remove supabase option
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_storage_provider_check;
ALTER TABLE tracks ADD CONSTRAINT tracks_storage_provider_check 
  CHECK (storage_provider IN ('google_drive', 'dropbox', 'onedrive'));

-- Update default storage provider to null (user must choose)
ALTER TABLE tracks ALTER COLUMN storage_provider DROP DEFAULT;

-- Update user_storage_providers table constraint
ALTER TABLE user_storage_providers DROP CONSTRAINT IF EXISTS user_storage_providers_provider_check;
ALTER TABLE user_storage_providers ADD CONSTRAINT user_storage_providers_provider_check 
  CHECK (provider IN ('google_drive', 'dropbox', 'onedrive'));

-- Clean up any profiles with supabase-specific storage limits
-- Set a default 15GB limit for BYOS users (most cloud providers offer this minimum)
UPDATE profiles SET storage_limit = 16106127360 WHERE storage_limit = 10737418240; -- 15GB instead of 10GB