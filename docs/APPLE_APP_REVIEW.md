# Apple App Review - Test User Documentation

## Test User Credentials

For Apple App Review, we have created a dedicated test user account with pre-populated data.

### Login Credentials
- **Email:** `apple.review@coretet.test`
- **Password:** `AppleTest2025!`

## Features Available to Test User

The test user account includes:

1. **Sample Tracks** (3 pre-loaded tracks)
   - Ambient Loop (category: loops)
   - Beat Demo (category: songs)  
   - One Shot SFX (category: oneshots)

2. **Sample Playlist**
   - "Apple Review Test Playlist" with all sample tracks

3. **Full Feature Access**
   - Track upload and management
   - Playlist creation and editing
   - Rating system (listened/liked/loved)
   - Search and filtering
   - Tag management
   - Collection organization
   - Tasks/to-do functionality

4. **Storage**
   - 5GB storage allocation
   - Upload capability enabled

## Password Reset Testing

To test password reset functionality:

1. On the sign-in page, click "Forgot password?"
2. Enter the test email: `apple.review@coretet.test`
3. Check email for reset link (Note: For test account, email may not actually send)
4. The reset flow is fully functional at `/reset-password` route

## Setting Up the Test User

If you need to recreate the test user:

### Option 1: Using the Script (Recommended)

1. Add your Supabase service role key to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. Run the creation script:
   ```bash
   npm run create-test-user
   ```

### Option 2: Manual Setup via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Users
3. Click "Add user" → "Create new user"
4. Enter:
   - Email: `apple.review@coretet.test`
   - Password: `AppleTest2025!`
   - Auto Confirm Email: Yes

5. Run the SQL script in `/database/scripts/create_test_user.sql` to set up profile and sample data

## Important Notes for Review

1. **Audio Files**: The sample tracks use placeholder URLs. In production, these would be actual audio files stored in Supabase Storage.

2. **Email Verification**: The test account is pre-verified and does not require email confirmation.

3. **Collaboration Features**: The test user can receive and send playlist invitations, though email delivery may be simulated in test environment.

4. **Mobile App**: The web app is responsive and includes specific mobile routes at `/mobile/*` for app integration.

## Test Scenarios

### Basic User Flow
1. Sign in with test credentials
2. Browse sample tracks in Library
3. Play a track
4. Create a new playlist
5. Add tracks to playlist
6. Rate tracks (listened/liked/loved)
7. Use search and filters
8. Upload a new track (can use any audio file)

### Password Management
1. While logged in, go to Account → Settings
2. Click "Change Password"
3. Enter new password and confirm
4. Sign out and sign back in with new password

### Organization Features  
1. Create collections/albums
2. Add tags to tracks
3. Use batch operations (select multiple tracks)
4. Create track variations
5. Use the Tasks feature for to-dos

## Support

If the review team needs any additional test scenarios or encounters issues, please reference:
- Main app URL: [Your deployed URL]
- Test environment: [If different from production]
- Technical contact: [Your contact info]

## Reset Test Data

To reset the test user to original state:
1. Delete the user from Supabase Auth dashboard
2. Re-run the creation script: `npm run create-test-user`

This will create a fresh test account with clean sample data.