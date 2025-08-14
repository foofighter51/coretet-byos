-- CoreTet BYOS Support Migration
-- Adds storage provider functionality while preserving existing data

-- Storage provider connections table
CREATE TABLE IF NOT EXISTS user_storage_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'dropbox', 'onedrive', 'supabase')),
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  provider_email TEXT,
  storage_quota BIGINT,
  storage_used BIGINT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add provider info to tracks table (nullable for backward compatibility)
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('google_drive', 'dropbox', 'onedrive', 'supabase')),
ADD COLUMN IF NOT EXISTS provider_file_id TEXT,
ADD COLUMN IF NOT EXISTS provider_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_storage_providers_user_id ON user_storage_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_providers_provider ON user_storage_providers(provider);
CREATE INDEX IF NOT EXISTS idx_user_storage_providers_active ON user_storage_providers(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tracks_storage_provider ON tracks(storage_provider);
CREATE INDEX IF NOT EXISTS idx_tracks_provider_file_id ON tracks(provider_file_id) WHERE provider_file_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE user_storage_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_storage_providers
CREATE POLICY "Users can view own storage providers" 
ON user_storage_providers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storage providers" 
ON user_storage_providers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storage providers" 
ON user_storage_providers FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own storage providers" 
ON user_storage_providers FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_storage_providers_updated_at 
BEFORE UPDATE ON user_storage_providers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one active provider per user
CREATE OR REPLACE FUNCTION ensure_single_active_provider()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a provider as active, deactivate all others for this user
  IF NEW.is_active = true THEN
    UPDATE user_storage_providers 
    SET is_active = false 
    WHERE user_id = NEW.user_id 
    AND provider != NEW.provider;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to ensure single active provider
CREATE TRIGGER ensure_single_active_provider_trigger
BEFORE INSERT OR UPDATE ON user_storage_providers
FOR EACH ROW EXECUTE FUNCTION ensure_single_active_provider();

-- Insert default Supabase provider for existing users
INSERT INTO user_storage_providers (user_id, provider, is_active, storage_quota, storage_used)
SELECT 
  id as user_id,
  'supabase' as provider,
  true as is_active,
  storage_limit as storage_quota,
  storage_used
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_storage_providers 
  WHERE user_storage_providers.user_id = profiles.id 
  AND user_storage_providers.provider = 'supabase'
);

-- Create a view for easy provider access
CREATE OR REPLACE VIEW user_active_provider AS
SELECT 
  usp.*,
  p.email as user_email
FROM user_storage_providers usp
JOIN auth.users u ON usp.user_id = u.id
LEFT JOIN profiles p ON u.id = p.id
WHERE usp.is_active = true;

-- RLS for the view
ALTER VIEW user_active_provider SET (security_barrier = true);
GRANT SELECT ON user_active_provider TO authenticated;

-- Storage management functions
CREATE OR REPLACE FUNCTION get_user_storage_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_providers', COUNT(*),
    'active_provider', (
      SELECT json_build_object(
        'provider', provider,
        'storage_used', storage_used,
        'storage_quota', storage_quota,
        'provider_email', provider_email
      )
      FROM user_storage_providers 
      WHERE user_id = p_user_id AND is_active = true
      LIMIT 1
    ),
    'all_providers', json_agg(
      json_build_object(
        'provider', provider,
        'connected', (encrypted_access_token IS NOT NULL),
        'is_active', is_active,
        'storage_used', storage_used,
        'storage_quota', storage_quota,
        'provider_email', provider_email,
        'created_at', created_at
      )
    )
  ) INTO result
  FROM user_storage_providers
  WHERE user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch active provider
CREATE OR REPLACE FUNCTION switch_active_provider(p_provider TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Get current user ID
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if provider exists and is connected
  IF NOT EXISTS (
    SELECT 1 FROM user_storage_providers 
    WHERE user_id = user_id_val 
    AND provider = p_provider 
    AND encrypted_access_token IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Provider % is not connected for user', p_provider;
  END IF;
  
  -- Deactivate all providers for user
  UPDATE user_storage_providers 
  SET is_active = false 
  WHERE user_id = user_id_val;
  
  -- Activate the specified provider
  UPDATE user_storage_providers 
  SET is_active = true 
  WHERE user_id = user_id_val 
  AND provider = p_provider;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_storage_providers TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_storage_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION switch_active_provider(TEXT) TO authenticated;

-- Create storage event log for debugging (optional)
CREATE TABLE IF NOT EXISTS storage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'upload', 'download', 'connection', 'error'
  provider TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_events_user_id ON storage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_events_type ON storage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_storage_events_created_at ON storage_events(created_at);

-- RLS for storage events
ALTER TABLE storage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storage events" 
ON storage_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storage events" 
ON storage_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant permissions for storage events
GRANT ALL ON storage_events TO authenticated;