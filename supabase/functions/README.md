# Supabase Edge Functions

## Setup Instructions

### 1. Deploy the send-feedback function

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-feedback
```

### 2. Set up email service (Optional but recommended)

The send-feedback function supports Resend for sending emails. To enable email sending:

1. Sign up for a free account at [Resend](https://resend.com)
2. Get your API key
3. Add it to your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

### 3. Alternative: Use Supabase's built-in email (if available)

If you have email enabled in your Supabase project, you can modify the edge function to use Supabase's email service instead.

## How it works

1. User submits feedback through the app
2. The edge function:
   - Saves feedback to the database
   - Sends an email to coretetapp@gmail.com (if email service is configured)
3. If email fails, feedback is still saved in the database

## Testing

You can test the function locally:

```bash
supabase functions serve send-feedback --no-verify-jwt
```

## Notes

- The function will work without email configuration - it will just save to the database
- All feedback is stored in the `feedback` table regardless of email status
- The function requires authentication (user must be logged in)