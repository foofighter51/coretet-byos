-- Fix Missing User Profile Data
-- Run this in Supabase SQL Editor after successful login

-- First, check what's missing for your user
-- Replace 'your-email@example.com' with your actual email
SELECT 
  u.id as user_id,
  u.email,
  p.id as profile_exists,
  ur.role as user_role,
  usp.provider as storage_provider
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN user_storage_providers usp ON u.id = usp.user_id AND usp.is_active = true
WHERE u.email = 'your-email@example.com';

-- Create missing profile (replace 'USER_ID_HERE' with your actual user ID from above query)
INSERT INTO profiles (id, email, storage_limit, storage_used, is_active, created_at)
VALUES ('68b47b60-e826-4c4b-a433-90759f1240c8', 'your-email@example.com', 10737418240, 0, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create user role
INSERT INTO user_roles (user_id, role)
VALUES ('68b47b60-e826-4c4b-a433-90759f1240c8', 'user')
ON CONFLICT (user_id) DO NOTHING;

-- Create default storage provider
INSERT INTO user_storage_providers (user_id, provider, is_active, storage_quota, storage_used, created_at, updated_at)
VALUES ('68b47b60-e826-4c4b-a433-90759f1240c8', 'supabase', true, 10737418240, 0, NOW(), NOW())
ON CONFLICT (user_id, provider) DO NOTHING;

-- Verify everything was created
SELECT 
  u.id as user_id,
  u.email,
  p.id as profile_exists,
  ur.role as user_role,
  usp.provider as storage_provider,
  usp.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN user_storage_providers usp ON u.id = usp.user_id
WHERE u.email = 'your-email@example.com';