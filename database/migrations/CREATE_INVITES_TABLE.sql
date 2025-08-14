-- Create invites table for user invitation system
-- Run this BEFORE FIX_ADMIN_DASHBOARD_RLS.sql

-- Create the invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9]{8}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin can view all invites"
ON invites FOR SELECT
TO authenticated
USING (
  auth.email() = 'ericexley@gmail.com'
);

CREATE POLICY "Admin can create invites"
ON invites FOR INSERT
TO authenticated
WITH CHECK (
  auth.email() = 'ericexley@gmail.com' AND created_by = auth.uid()
);

CREATE POLICY "Admin can update invites"
ON invites FOR UPDATE
TO authenticated
USING (auth.email() = 'ericexley@gmail.com')
WITH CHECK (auth.email() = 'ericexley@gmail.com');

-- Allow users to view their own created invites
CREATE POLICY "Users can view own invites"
ON invites FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);

-- Grant permissions
GRANT ALL ON invites TO authenticated;
-- No sequence needed for UUID primary key

-- Create initial invite for testing (optional - comment out if not needed)
-- INSERT INTO invites (code, email, created_by, expires_at)
-- VALUES (
--   'WELCOME1',
--   null,
--   (SELECT id FROM auth.users WHERE email = 'ericexley@gmail.com' LIMIT 1),
--   now() + interval '7 days'
-- );

-- Verify table creation
SELECT 
  'Invites table created successfully!' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'invites';

-- Check if admin user exists
SELECT 
  'Admin user check:' as info,
  email,
  id
FROM auth.users 
WHERE email = 'ericexley@gmail.com';