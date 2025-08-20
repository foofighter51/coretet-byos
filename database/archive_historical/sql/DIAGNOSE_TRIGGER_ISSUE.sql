-- Diagnose which trigger is causing the 500 error

-- 1. List ALL active triggers on auth.users
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgisinternal = false
ORDER BY t.tgname;

-- 2. Check the update_user_storage function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_user_storage';

-- 3. Check the auto_confirm_user function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'auto_confirm_user';

-- 4. Temporarily disable all custom triggers and test
DO $$
BEGIN
  -- Disable our custom triggers
  ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
  ALTER TABLE auth.users DISABLE TRIGGER auto_confirm_on_signup;
  
  RAISE NOTICE 'Custom triggers disabled. Try signup now.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error disabling triggers: %', SQLERRM;
END $$;

-- 5. Check if update_user_storage trigger exists and what table it's on
SELECT 
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE p.proname = 'update_user_storage';

-- 6. If you want to completely remove problematic triggers (run these one by one as needed):
/*
-- Remove auto_confirm trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;
DROP FUNCTION IF EXISTS auto_confirm_user();

-- Remove update_user_storage trigger if it's on auth.users
DROP TRIGGER IF EXISTS update_user_storage_trigger ON auth.users;

-- Re-enable our minimal handle_new_user trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
*/