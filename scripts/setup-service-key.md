# Setting Up Service Role Key for Test User Creation

## Steps to Get Your Service Role Key:

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Settings**
   - Click on "Settings" in the left sidebar (gear icon)
   - Click on "API" under Configuration

3. **Find Service Role Key**
   - Look for the section "Project API keys"
   - Find "service_role" (secret)
   - Click the "Reveal" button
   - Copy the key (it starts with `eyJ...`)

4. **Add to Your .env File**
   - Open your `.env` file
   - Add this line at the end:
   ```
   SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
   ```

5. **Run the Script Again**
   ```bash
   npm run create-test-user
   ```

## Important Security Notes:

⚠️ **NEVER commit the service role key to git**
- The `.env` file should be in `.gitignore` (already is)
- This key has admin privileges - keep it secret
- Only use it for admin scripts, never in client code

## Alternative: Create User Manually

If you prefer not to use the service role key, you can create the test user manually:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `apple.review@coretet.test`
   - Password: `AppleTest2025!`
   - Auto Confirm Email: ✓ (checked)
4. Click "Create user"
5. Then run the SQL in `/database/scripts/create_test_user.sql` in the SQL Editor

The manual method is perfectly fine for a one-time setup!