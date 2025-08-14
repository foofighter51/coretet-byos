-- Coretet Database Backup Script
-- Created: 2024-07-29
-- This script documents the current database schema and creates backup commands

-- ============================================
-- BACKUP INSTRUCTIONS
-- ============================================
-- 1. Go to Supabase Dashboard > Settings > Database
-- 2. Click "Backups" tab
-- 3. Create a manual backup with name: "pre-complex-features-2024-07-29"
-- 
-- OR use Supabase CLI:
-- supabase db dump -f backup_2024_07_29.sql

-- ============================================
-- CURRENT SCHEMA DOCUMENTATION
-- ============================================

-- 1. USERS & PROFILES
-- Users are managed by Supabase Auth (auth.users)
-- Profiles extend user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INVITES SYSTEM
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9]{8}$'),
  email TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 3. TRACKS
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  duration INTEGER,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  genre TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  play_count INTEGER DEFAULT 0,
  last_played TIMESTAMPTZ,
  color_palette JSONB,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  metadata JSONB
);

-- 4. PLAYLISTS
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cover_image TEXT,
  play_count INTEGER DEFAULT 0,
  share_token TEXT UNIQUE
);

-- 5. PLAYLIST TRACKS
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(playlist_id, position)
);

-- 6. PLAYLIST SHARES
CREATE TABLE IF NOT EXISTS playlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id),
  shared_by UUID REFERENCES auth.users(id) NOT NULL,
  permission_level TEXT CHECK (permission_level IN ('view', 'edit')) DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT
);

-- 7. TRACK METADATA
CREATE TABLE IF NOT EXISTS track_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[],
  notes TEXT,
  custom_genre TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  mood TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);

-- 8. LISTENING HISTORY
CREATE TABLE IF NOT EXISTS listening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  play_duration INTEGER,
  completed BOOLEAN DEFAULT false
);

-- ============================================
-- CURRENT RLS POLICIES
-- ============================================
-- Run this to backup current RLS policies:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- CURRENT FUNCTIONS & TRIGGERS
-- ============================================
-- Active trigger on auth.users:
-- handle_new_user() - Creates profile when user signs up

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. Email confirmations are DISABLED in Supabase Auth settings
-- 2. Invite-only signup is enforced in application code (AuthContext.tsx)
-- 3. Admin user is: ericexley@gmail.com
-- 4. Storage bucket: 'tracks' (public read, authenticated write)
-- 5. Edge Functions deployed: send-feedback, send-playlist-invite, share-playlist

-- ============================================
-- ENVIRONMENT VARIABLES TO BACKUP
-- ============================================
-- Make sure to backup these from Supabase Dashboard > Settings > Edge Functions:
-- - RESEND_API_KEY
-- - ADMIN_EMAIL (ericexley@gmail.com)
-- - APP_URL (your deployment URL)

-- ============================================
-- TO RESTORE FROM BACKUP
-- ============================================
-- 1. Use Supabase Dashboard > Settings > Database > Backups > Restore
-- 2. OR: supabase db reset && psql -f backup_2024_07_29.sql