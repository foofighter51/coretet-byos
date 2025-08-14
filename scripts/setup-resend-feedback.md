# Quick Setup: Resend for Feedback Emails

## Prerequisites
- Supabase CLI installed
- Access to your Supabase project

## Step 1: Get Your Project Reference
1. Go to your Supabase dashboard
2. Look at the URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`
3. Copy the project reference ID

## Step 2: Link Supabase CLI
```bash
cd /Users/ericexley/Downloads/coretet_no_ai
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 3: Deploy the Edge Function
```bash
supabase functions deploy send-feedback
```

## Step 4: Set Up Resend
1. Go to [Resend.com](https://resend.com) and sign up (free tier is fine)
2. In Resend dashboard:
   - Add and verify your domain (coretet.com) OR
   - Use their test domain for now
3. Get your API key from Resend dashboard

## Step 5: Add Resend API Key to Supabase
```bash
supabase secrets set RESEND_API_KEY=re_YOUR_RESEND_API_KEY
```

## Step 6: Update Email Configuration (if needed)
If you're not using coretet.com domain yet, you'll need to update the "from" email in the edge function:

1. Edit `/supabase/functions/send-feedback/index.ts`
2. Change line 77 from:
   ```typescript
   from: 'CoreTet <noreply@coretet.com>',
   ```
   To:
   ```typescript
   from: 'CoreTet <onboarding@resend.dev>', // Use Resend's test domain
   ```
3. Redeploy the function:
   ```bash
   supabase functions deploy send-feedback
   ```

## Step 7: Test It
1. Go to your live app at coretet.app
2. Click the "Feedback" button
3. Submit test feedback
4. Check:
   - Your email (coretetapp@gmail.com)
   - Supabase dashboard > Table Editor > feedback table

## Verification Commands
```bash
# Check if function is deployed
supabase functions list

# Check if secret is set
supabase secrets list

# View function logs
supabase functions logs send-feedback
```

## Common Issues
- **"from" email not verified**: Use `onboarding@resend.dev` for testing
- **CORS errors**: Make sure you're logged in when submitting feedback
- **No email received**: Check spam folder and Resend dashboard for send logs