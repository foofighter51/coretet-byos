# Debug Signup Issue - Database Error

## Error Analysis
```
POST https://vqkpdfkevjtdloldmqcb.supabase.co/auth/v1/signup 500 (Internal Server Error)
AuthApiError: Database error saving new user
```

This suggests an issue with the database trigger that runs when a new user signs up.

## Potential Issues

1. **Missing profiles table constraints** - The trigger tries to create a profile but fails
2. **RLS policy conflicts** - New user creation blocked by security policies  
3. **Foreign key constraints** - Reference to non-existent data
4. **Trigger function errors** - Bug in the `handle_new_user()` function

## Debug Steps

### Step 1: Check Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Look for recent errors around user creation
3. Check for constraint violations or trigger errors

### Step 2: Test Trigger Function Manually
Run this in Supabase SQL Editor to test the trigger:
```sql
-- Test the trigger function directly
SELECT handle_new_user();

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles', 'user_storage_providers');

-- Check for constraint issues
SELECT 
  tc.constraint_name, 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('profiles', 'user_roles', 'user_storage_providers');
```

### Step 3: Simplified Fix
If the trigger is causing issues, temporarily disable it and create a minimal user:

```sql
-- Disable the trigger temporarily  
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Try creating a user manually first
-- Go to Supabase Dashboard → Authentication → Users → Invite User
-- Use email and send invite

-- Re-enable trigger after testing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 4: Check for Missing Dependencies
The trigger might be failing because:
- `profiles` table doesn't exist
- `user_roles` table doesn't exist  
- `user_storage_providers` table doesn't exist
- RLS policies are too restrictive

## Quick Fix Attempt

Try this simplified trigger function:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert profile (with error handling)
  BEGIN
    INSERT INTO profiles (id, email, storage_limit)
    VALUES (NEW.id, NEW.email, 10737418240);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Try to insert user role
  BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user role for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Immediate Action

Check your Supabase dashboard logs to see the exact error!