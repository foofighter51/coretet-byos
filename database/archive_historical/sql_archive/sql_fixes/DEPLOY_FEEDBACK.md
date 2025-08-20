# Deploy Feedback System

Follow these steps to enable direct email sending from the CoreTet app:

## 1. Install Supabase CLI (if not already installed)

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

## 2. Log in to Supabase CLI

```bash
supabase login
```

This will open a browser window for authentication.

## 3. Link to your project

```bash
# Navigate to your project directory
cd /Users/ericexley/Downloads/coretet_no_ai

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID. You can find this in your Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

## 4. Deploy the send-feedback function

```bash
supabase functions deploy send-feedback
```

## 5. Set up email service (Recommended)

### Option A: Using Resend (Recommended)

1. Sign up for a free account at [Resend.com](https://resend.com)
2. Verify your email domain or use their test domain
3. Get your API key from the Resend dashboard
4. Add the API key to your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY_HERE
```

### Option B: Without email service

The feedback system will still work without email configuration - feedback will be saved to the database and you can view it there.

## 6. Test the deployment

After deployment, test the feedback system:

1. Click the "Feedback" button in your app
2. Fill in a topic and comment
3. Click "Send Feedback"

If everything is set up correctly:
- With Resend: Email will be sent to coretetapp@gmail.com
- Without Resend: Feedback will be saved to the database only

## Troubleshooting

### If the function fails to deploy:

1. Make sure you're in the project root directory
2. Check that the function exists: `ls supabase/functions/send-feedback/`
3. Try deploying with verbose output: `supabase functions deploy send-feedback --debug`

### If emails aren't sending:

1. Check the function logs:
```bash
supabase functions logs send-feedback
```

2. Verify your Resend API key is set:
```bash
supabase secrets list
```

3. For Resend, make sure:
   - Your domain is verified (or use their test domain)
   - The API key has sending permissions
   - The "from" email address in the function matches your verified domain

### If you see CORS errors:

The function already includes CORS headers, but if you still see issues:
1. Check that the function URL in your app matches your Supabase project
2. Make sure you're passing the Authorization header with the user's session token

## Notes

- The function requires authentication (users must be logged in)
- All feedback is stored in the database regardless of email status
- The email includes user information and timestamps automatically
- If email fails, users will see a message that their feedback was saved

## Database Access

To view feedback in your database:

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Select the `feedback` table
4. You'll see all submitted feedback with user IDs, topics, comments, and timestamps