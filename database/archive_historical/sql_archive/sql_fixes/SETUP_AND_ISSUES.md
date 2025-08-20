# CoreTet (No AI) - Complete Setup Guide & Issues Found

## 🚨 Critical Issues Found

### 1. **Database Schema Issues**
- **AI-related columns still present**: The migration still includes `ai_recommended_tags` and `analysis` columns in the tracks table
- **S3 references**: The schema uses `s3_key` but the app isn't configured for AWS S3
- **Missing metadata columns**: The tracks table is missing user-editable metadata fields like `tempo`, `key`, `mood`, etc.

### 2. **Authentication Flow Issues**
- The app gets stuck in loading state when `supabase.auth.getSession()` is called
- No error handling for failed authentication state initialization
- Missing profile creation could cause the auth flow to hang

### 3. **Type Mismatches**
- The TypeScript types in `src/types/index.ts` include fields not in the database schema
- Track type has `tempo`, `key`, `mood`, etc. but these aren't in the database

### 4. **Remaining AI References**
- Comments in migration file mention "AI analysis results storage"
- Edge function `upload-track` may still have AI webhook references

## 📋 Fresh Supabase Setup Guide

### Step 1: Clean Supabase Database

If you want to start fresh, run this in your Supabase SQL editor:

```sql
-- Drop all existing tables and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS track_storage_changes ON tracks;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_user_storage();
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

### Step 2: Create Updated Schema

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB in bytes
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Invites table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  used_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated tracks table without AI fields
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL, -- Changed from s3_key to file_path for Supabase storage
  duration REAL,
  category TEXT NOT NULL CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos')),
  tags TEXT[] DEFAULT '{}',
  -- User-editable metadata fields
  tempo INTEGER,
  key TEXT,
  time_signature TEXT,
  mood TEXT,
  genre TEXT,
  instruments TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create all policies (same as before)
-- ... (include all the policies from the original migration)

-- Create functions and triggers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- First user becomes admin
  IF (SELECT COUNT(*) FROM user_roles) = 0 THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Storage tracking function
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET storage_used = storage_used + NEW.file_size
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET storage_used = storage_used - OLD.file_size
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for storage tracking
CREATE TRIGGER track_storage_changes
  AFTER INSERT OR DELETE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_user_storage();
```

### Step 3: Set up Supabase Storage

1. Go to your Supabase dashboard → Storage
2. Create a new bucket called `tracks`
3. Set the bucket to private
4. Add these policies:

```sql
-- Allow authenticated users to upload their own tracks
CREATE POLICY "Users can upload own tracks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own tracks
CREATE POLICY "Users can read own tracks"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own tracks
CREATE POLICY "Users can delete own tracks"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 4: Fix TypeScript Types

Update `src/types/index.ts` to match the new schema:

```typescript
export interface Track {
  id: string;
  user_id: string;
  name: string;
  file_name: string;
  file_size: number;
  file_path: string; // Changed from url
  duration: number | null;
  category: TrackCategory;
  tags: string[];
  // User-editable metadata
  tempo?: number | null;
  key?: string | null;
  time_signature?: string | null;
  mood?: string | null;
  genre?: string | null;
  instruments?: string[];
  notes?: string | null;
  created_at: string;
}
```

### Step 5: Environment Setup

Make sure your `.env` file has:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 6: Test the Setup

1. Clear your browser's local storage
2. Hard refresh the page (Ctrl+Shift+R)
3. Check the browser console for errors
4. The login page should appear

## 🔧 Quick Fixes Needed

1. **Remove AI columns from migration**
2. **Update Track type to match database schema**
3. **Fix file storage to use Supabase Storage instead of S3**
4. **Add error handling in AuthContext**
5. **Remove console.log statements**
6. **Update UI text that mentions AI**

## 🚀 Next Steps

1. Apply the database migration above
2. Update the TypeScript types
3. Fix the file upload to use Supabase Storage
4. Test user registration and login
5. Verify file upload works correctly

The main issue causing the spinning is likely that the auth system is trying to load user data that doesn't exist due to schema mismatches.