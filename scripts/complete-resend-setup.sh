#!/bin/bash

# Complete Resend Setup Script
# Run this to finalize your feedback email system

echo "🚀 Completing Resend Setup for CoreTet Feedback"
echo "=============================================="
echo ""

# Check if already linked
echo "1️⃣ Checking Supabase link status..."
if supabase status >/dev/null 2>&1; then
    echo "✅ Already linked to Supabase project"
else
    echo "❌ Not linked. Please run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo ""
echo "2️⃣ Setting Resend API Key..."
echo "Please enter your Resend API key (starts with 're_'):"
read -s RESEND_KEY
echo ""

if [[ $RESEND_KEY == re_* ]]; then
    supabase secrets set RESEND_API_KEY=$RESEND_KEY
    echo "✅ Resend API key set successfully"
else
    echo "❌ Invalid API key format. Should start with 're_'"
    exit 1
fi

echo ""
echo "3️⃣ Deploying send-feedback function..."
supabase functions deploy send-feedback

echo ""
echo "4️⃣ Setup complete! Here's how to test:"
echo "   - Go to coretet.app"
echo "   - Click the 'Feedback' button"
echo "   - Submit test feedback"
echo "   - Check coretetapp@gmail.com for the email"
echo ""
echo "5️⃣ To view function logs:"
echo "   supabase functions logs send-feedback"
echo ""
echo "✅ All done! Your feedback system is ready."