#!/bin/bash

# Test signup directly with curl
# Replace with your actual Supabase URL and anon key

SUPABASE_URL="https://chynnmeidbcqsnswlxmt.supabase.co"
SUPABASE_ANON_KEY="YOUR_ANON_KEY" # You'll need to add this

curl -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "testpassword123"
  }' \
  -v