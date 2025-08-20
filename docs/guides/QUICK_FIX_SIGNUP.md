# Quick Fix for Signup Issue

## The Problem
The signup is failing with a 500 error due to a database trigger issue.

## Immediate Solution

### Step 1: Disable the Problematic Trigger
Go to **Supabase SQL Editor** and run:

```sql
-- Disable the trigger that's causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

### Step 2: Try Signup Again
After running the above, try creating your account again at http://localhost:5175/

### Step 3: Manually Create Profile (if needed)
If signup works but you get other errors, manually create your profile:

```sql
-- Replace 'YOUR_EMAIL' with your actual email
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL';

-- Then create profile manually (replace USER_ID_HERE with actual UUID)
INSERT INTO profiles (id, email, storage_limit, is_active)
VALUES ('USER_ID_HERE', 'YOUR_EMAIL', 10737418240, true);

-- Create user role
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'user');

-- Create default storage provider
INSERT INTO user_storage_providers (user_id, provider, is_active, storage_quota, storage_used)
VALUES ('USER_ID_HERE', 'supabase', true, 10737418240, 0);
```

### Step 4: Alternative - Use Supabase Dashboard
Instead of the app signup:
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Invite User"**
3. Enter your email
4. Check your email and follow the link
5. Set your password

This completely bypasses the problematic trigger.

## Why This Happens
The `handle_new_user()` function in the foundation migration tries to create multiple related records when a user signs up. One of these insertions is failing, causing the entire signup to fail.

## After You Get In
Once you can log in, the storage settings should work perfectly since we're using the simplified context that doesn't depend on the complex trigger logic.

Try **Step 1** first - that should fix it immediately!