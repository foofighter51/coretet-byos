# Beta Deployment TODO List

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Set production Supabase URL and keys in hosting platform
- [ ] Configure `APP_URL` environment variable to production domain
- [ ] Set up Resend API key for email notifications (optional but recommended)
- [ ] Ensure all `.env` variables are properly set in production

### 2. Database Verification
- [ ] Verify all migrations have been applied:
  - [ ] Playlists tables (`20250723_create_playlists_table_safe.sql`)
  - [ ] Collaborator system (`20250724_collaborator_system.sql`)
  - [ ] Feedback table (`20250723_create_feedback_table.sql`)
- [ ] Test RLS policies are working correctly
- [ ] Verify storage bucket permissions for audio files

### 3. Edge Functions
- [ ] Verify edge functions are deployed:
  - [ ] `collaborator-auth`
  - [ ] `share-playlist`
  - [ ] `send-feedback` (if using feedback system)
- [ ] Set production secrets:
  ```bash
  supabase secrets set APP_URL=https://your-domain.com
  supabase secrets set RESEND_API_KEY=your_key  # Optional
  ```

### 4. Build & Deployment
- [ ] Run production build locally to check for errors:
  ```bash
  npm run build
  ```
- [ ] Fix any TypeScript or build errors
- [ ] Test production build locally:
  ```bash
  npm run preview
  ```
- [ ] Deploy to hosting platform (Vercel, Netlify, etc.)

### 5. DNS & Domain
- [ ] Point domain to hosting platform
- [ ] Set up SSL certificate (usually automatic)
- [ ] Configure subdomain if needed (e.g., beta.coretet.com)

### 6. Post-Deployment Testing
- [ ] Test main user signup/login flow
- [ ] Test file upload and playback
- [ ] Test playlist creation and sharing
- [ ] Test collaborator invite flow (end-to-end)
- [ ] Test feedback system
- [ ] Check browser console for errors
- [ ] Test on mobile devices

### 7. Monitoring & Analytics
- [ ] Set up error tracking (Sentry, LogRocket, etc.) - optional
- [ ] Set up basic analytics - optional
- [ ] Monitor Supabase dashboard for usage

### 8. Beta User Communication
- [ ] Prepare welcome email for beta users
- [ ] Create simple documentation or FAQ
- [ ] Set up communication channel for feedback
- [ ] Prepare list of known limitations

## Known Issues for Beta

1. **Collaborator local testing** - Works better in production
2. **Email notifications** - Require Resend setup or users must get links manually
3. **Storage limits** - Currently 1GB per user (configurable)

## Quick Commands Reference

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy edge functions
supabase functions deploy --all

# Check function logs
supabase functions logs <function-name>

# Run migrations manually if needed
supabase db push
```

## Rollback Plan

If issues arise:
1. Keep database migrations (they're backward compatible)
2. Can disable collaborator features by removing UI elements
3. Edge functions can be updated without affecting main app
4. Previous backups available in project directory

## Success Metrics

- [ ] Beta users can sign up and upload music
- [ ] Sharing features work end-to-end
- [ ] No critical errors in production
- [ ] Feedback system captures user input