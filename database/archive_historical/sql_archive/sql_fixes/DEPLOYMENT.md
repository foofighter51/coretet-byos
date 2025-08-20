# CoreTet Deployment Guide

## Pre-Deployment Checklist

- [x] Production build works locally
- [ ] Environment variables configured
- [ ] Supabase production instance ready
- [ ] Domain name ready (optional)

## Deployment Options

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to connect GitHub/GitLab
4. Set environment variables in Vercel dashboard

### Option 2: Netlify
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy`
3. Follow prompts
4. Set environment variables in Netlify dashboard

### Option 3: Manual Deployment
1. Build: `npm run build`
2. Upload `dist` folder to your hosting provider
3. Configure SPA routing (all routes → index.html)

## Environment Variables to Set

```
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## Post-Deployment Steps

1. **Test Core Features**:
   - [ ] User authentication works
   - [ ] File upload works
   - [ ] Track playback works
   - [ ] Playlist creation works

2. **Configure Supabase**:
   - [ ] Add production URL to allowed redirects
   - [ ] Configure email templates
   - [ ] Enable email confirmations

3. **Run Auth Migration**:
   - [ ] Backup current data
   - [ ] Run migration script
   - [ ] Test both user types can log in
   - [ ] Clean up old tables

## Quick Deploy Commands

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

## Rollback Plan
- Keep current version tagged
- Vercel/Netlify auto-maintain previous deployments
- Can instant rollback via dashboard