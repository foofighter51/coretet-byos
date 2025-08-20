# Beta User Invitation Guide for CoreTet

## Overview
CoreTet uses Supabase Auth for user management. Since you're the only user currently, you can invite beta users through several methods.

## Method 1: Direct Signup (Simplest for Beta)

### Steps:
1. **Share the app URL**: Give beta users `coretet.app`
2. **They click "Sign Up"** on the login page
3. **They create their account** with email/password
4. **They're in!** They'll have their own music library

### Pros:
- No setup required
- Users manage their own passwords
- Immediate access

### Cons:
- Anyone with the URL can sign up
- No invite-only control

## Method 2: Password Protection (Current Setup)

If you still have the Netlify password protection enabled:

1. **Share the Netlify password** with beta users first
2. **Then share the app URL**
3. **They enter the site password**
4. **Then sign up normally**

To manage this:
- Go to Netlify → Site settings → Access & security → Password protection
- You can update or remove the password

## Method 3: Email Invitation System (More Controlled)

### Enable Email Invitations:
1. **In Supabase Dashboard**:
   - Go to Authentication → Settings
   - Under "Email Auth", ensure "Enable email confirmations" is ON
   - This sends verification emails

2. **Create Invite Codes** (optional):
   - You have an invite system in your admin panel
   - Access it at: coretet.app (log in as admin)
   - Look for "Invite Manager" in admin section

### How Invite System Works:
1. Generate invite codes in admin panel
2. Share codes with beta users
3. They enter code when signing up
4. System tracks who used which invite

## Method 4: Manual User Creation (Most Control)

### Via Supabase Dashboard:
1. **Go to Supabase Dashboard** → Authentication → Users
2. **Click "Add user"**
3. **Enter their email**
4. **Either**:
   - Set a temporary password (share it securely)
   - Click "Send invitation email" (if SMTP is configured)

### Via SQL Editor:
```sql
-- Check how many users you have
SELECT COUNT(*) FROM auth.users;

-- View existing users (careful with privacy)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

## Setting Up Email (If Needed)

If you want Supabase to send emails (password resets, invites):

1. **Go to Supabase Dashboard** → Settings → Auth
2. **Configure SMTP** (or use Supabase's default)
3. **Or integrate with Resend** (you already have this!)

## Beta User Experience

### First Time Setup:
1. User goes to `coretet.app`
2. Clicks "Sign up"
3. Creates account with email/password
4. Lands on empty library
5. Can upload their first tracks

### What Beta Users Can Do:
- Upload music files (mp3, wav, etc.)
- Organize into playlists
- Add metadata (artist, album, genre, etc.)
- Tag and rate tracks
- Search and filter their library

### What They Can't Do:
- See other users' music
- Share playlists (unless you enable collaborator features)
- Access admin features

## Monitoring Beta Users

### Check User Activity:
```sql
-- In Supabase SQL Editor

-- Count tracks per user
SELECT 
  u.email,
  COUNT(t.id) as track_count,
  MAX(t.created_at) as last_upload
FROM auth.users u
LEFT JOIN tracks t ON t.user_id = u.id
GROUP BY u.email
ORDER BY track_count DESC;

-- Check recent activity
SELECT 
  u.email,
  COUNT(CASE WHEN t.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as tracks_this_week
FROM auth.users u
LEFT JOIN tracks t ON t.user_id = u.id
GROUP BY u.email;
```

### View Feedback:
- Check the `feedback` table in Supabase
- Feedback emails go to `coretetapp@gmail.com`

## Best Practices for Beta

1. **Start Small**: Invite 3-5 trusted users first
2. **Set Expectations**: Let them know it's beta
3. **Gather Feedback**: Use the feedback button actively
4. **Monitor Usage**: Check Supabase dashboard regularly
5. **Be Responsive**: Fix issues quickly

## Quick Start Checklist

For your first beta users:

- [ ] Decide on invitation method (direct signup is easiest)
- [ ] Remove/update Netlify password if needed
- [ ] Prepare a welcome message with:
  - App URL: `coretet.app`
  - Brief instructions
  - Known limitations
  - How to report issues (Feedback button)
- [ ] Test the signup flow yourself with a different email
- [ ] Monitor the first few signups closely

## Limiting Signups (If Needed)

To close registrations after beta:
1. Supabase Dashboard → Authentication → Settings
2. Toggle "Enable signups" to OFF
3. Only existing users can log in

## Support Resources

Share these with beta users:
- **App URL**: coretet.app
- **Feedback**: Use the in-app Feedback button
- **Issues**: Email you directly
- **Basic Guide**: "Upload music → Organize → Play"

Remember: Every beta user's library is private to them. They can't see each other's music unless you specifically enable sharing features.