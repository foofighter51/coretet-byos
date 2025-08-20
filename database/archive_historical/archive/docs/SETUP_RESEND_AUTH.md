# Setting up Resend for Supabase Authentication Emails

## 1. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Create an API key from your Resend dashboard
3. Add your domain and verify it (or use Resend's testing domain)

## 2. Configure Supabase to use Resend

### Option A: Through Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings** → **Email Configuration**
3. Switch from "Built-in email service" to "Custom SMTP"
4. Enter these Resend SMTP settings:
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: `resend`
   - **Password**: Your Resend API key
   - **Sender email**: Your verified sender email
   - **Sender name**: Your app name

### Option B: Using Environment Variables
Add these to your Supabase project settings:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
SMTP_SENDER_EMAIL=noreply@yourdomain.com
SMTP_SENDER_NAME=Your App Name
```

## 3. For Development/Testing
If you want to disable email confirmation temporarily:

1. Go to **Authentication** → **Settings** → **Email Auth**
2. Toggle OFF "Enable email confirmations"
3. This allows immediate login after signup (good for development)

## 4. Custom Email Templates (Optional)
You can customize email templates in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Edit templates for:
   - Confirmation email
   - Password reset
   - Magic link
   - Email change

## 5. Alternative: Disable Email Confirmation for Beta
For your beta testing with invite codes, you might want to skip email confirmation entirely:

```sql
-- Run this in SQL editor to check current settings
SELECT * FROM auth.config WHERE key = 'email_confirm_required';

-- To disable email confirmation requirement
UPDATE auth.config SET value = 'false' WHERE key = 'email_confirm_required';
```

## Benefits of using Resend:
- No rate limits for production use
- Better deliverability
- Email analytics
- Webhooks for email events
- Custom domains
- Better debugging tools

## Testing the Setup:
1. Try signing up with a new account
2. Check Resend dashboard for sent emails
3. Verify emails are being delivered

Would you like me to help you set up the custom SMTP configuration or disable email confirmations for now?