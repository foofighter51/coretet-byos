/*
  # Initial CoreTet Database Schema

  1. New Tables
    - `profiles` - User profile information extending auth.users
    - `tracks` - Audio track metadata and analysis results  
    - `invites` - Invite code management for user registration
    - `user_roles` - Role-based access control (user/admin)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Admin-only access for invite management

  3. Features
    - Invite-only registration system
    - Storage limit tracking per user
    - AI analysis results storage
    - Tag system with AI recommendations
*/

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB in bytes
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  used_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  s3_key TEXT NOT NULL,
  duration REAL,
  category TEXT NOT NULL CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos')),
  tags TEXT[] DEFAULT '{}',
  ai_recommended_tags TEXT[] DEFAULT '{}',
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Tracks policies
CREATE POLICY "Users can read own tracks"
  ON tracks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracks"
  ON tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracks"
  ON tracks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracks"
  ON tracks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all tracks"
  ON tracks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Invites policies
CREATE POLICY "Anyone can read valid invites"
  ON invites
  FOR SELECT
  TO anon, authenticated
  USING (expires_at > NOW() AND used_by IS NULL);

CREATE POLICY "Admins can manage invites"
  ON invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User roles policies
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
DROP TRIGGER IF EXISTS track_storage_changes ON tracks;
CREATE TRIGGER track_storage_changes
  AFTER INSERT OR DELETE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_user_storage();