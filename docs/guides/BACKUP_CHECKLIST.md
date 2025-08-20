# Coretet Backup Checklist - July 29, 2024

## ✅ Database Backup Steps

1. **Create Supabase Backup**
   - [ ] Go to Supabase Dashboard → Settings → Database → Backups
   - [ ] Click "Create Backup" 
   - [ ] Name it: `pre-complex-features-2024-07-29`
   - [ ] Wait for backup to complete

2. **Alternative: CLI Backup**
   ```bash
   supabase db dump -f backup_2024_07_29.sql --local
   ```

## ✅ Environment Variables to Save

From Supabase Dashboard → Settings → Edge Functions → Secrets:
- [ ] `RESEND_API_KEY` - Your Resend API key
- [ ] `ADMIN_EMAIL` - ericexley@gmail.com
- [ ] `APP_URL` - Your Vercel deployment URL

## ✅ Current System State

### Working Features:
- ✅ Invite-only signup system
- ✅ Track upload and management
- ✅ Playlist creation and sharing
- ✅ Admin dashboard with user/invite management
- ✅ Soft delete for tracks
- ✅ Email notifications via Resend
- ✅ Public playlist sharing
- ✅ Track metadata and ratings

### Recent Fixes:
- ✅ Fixed 500 error during signup (removed problematic triggers)
- ✅ Fixed Admin Dashboard scrolling
- ✅ Enhanced auth error logging

### Database Schema Files:
- `BACKUP_DATABASE_2024_07_29.sql` - Full schema documentation
- `REMOVE_PROBLEMATIC_TRIGGERS.sql` - Latest auth fix

### Git Commit Hash:
- Current stable: `2835d8f`

## ✅ Vercel Environment Variables

From Vercel Dashboard → Settings → Environment Variables:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (if used)

## ✅ Storage Bucket Settings

Bucket: `tracks`
- Public read access
- Authenticated write access
- CORS configured for your domain

## 📝 Notes

- Email confirmations are DISABLED in Supabase Auth
- Invite validation happens in application code
- Admin access is hardcoded to ericexley@gmail.com
- All SQL debug files from today's session are not critical

## 🔄 To Restore

1. **Database**: Use Supabase Dashboard → Backups → Restore
2. **Code**: `git checkout 2835d8f`
3. **Environment**: Re-add all environment variables
4. **Edge Functions**: Re-deploy if needed