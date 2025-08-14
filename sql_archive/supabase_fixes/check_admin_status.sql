-- Check admin status for your user
-- Run these queries in Supabase SQL Editor

-- 1. Find your current user ID and check if you're an admin
SELECT 
    auth.uid() as your_user_id,
    ur.role as your_role,
    p.email as your_email
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.id = auth.uid();

-- 2. List all admin users in the system
SELECT 
    ur.user_id,
    ur.role,
    p.email,
    p.created_at
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin'
ORDER BY p.created_at;

-- 3. Check if user_roles table exists and has any data
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM user_roles;

-- 4. If you're not an admin but should be (e.g., you're the first user)
-- you can make yourself admin with this query:
-- IMPORTANT: Replace 'your-user-id-here' with your actual user ID from query #1
/*
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'your-user-id-here';
*/

-- 5. If user_roles table is empty or missing your entry, insert it:
-- IMPORTANT: Replace 'your-user-id-here' with your actual user ID from query #1
/*
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
*/