# CoreTet V2 - Quick Start Guide

## 🚀 Setup Instructions

### 1. Set Up Beta Environment on Netlify

1. **Go to [Netlify Dashboard](https://app.netlify.com)**
2. Click **"Add new site" → "Import an existing project"**
3. Choose **GitHub** and select `foofighter51/coretet-backend`
4. Configure build settings:
   - **Branch to deploy**: `develop`
   - **Build command**: `npm run build:v2`
   - **Publish directory**: `dist`
5. Click **"Deploy site"**
6. Go to **Site settings → Domain management**
7. Add custom domain: `beta.coretet.app`

### 2. Local Development Setup

```bash
# You're already on develop branch, so just:

# Install dependencies if needed
npm install

# Copy V2 environment template
cp .env.v2.example .env.local

# Edit .env.local with your Supabase credentials
# (same as V1 - find them in Supabase dashboard)

# Start V2 development
npm run dev:v2

# Or switch to V2 mode permanently
npm run v2
npm run dev
```

### 3. Verify V2 is Working

1. Open http://localhost:5173
2. Open browser console
3. You should see: `🚀 CoreTet V2 Mode Active`
4. Check features with: `__CORETET_FEATURES__`

## 📁 Where to Put V2 Code

```
✅ V2-Specific Code Goes Here:
src/v2/
├── components/     # New V2 components
├── contexts/       # New V2 contexts
├── hooks/          # New V2 hooks
├── services/       # New V2 business logic
├── types/          # New V2 TypeScript types
└── utils/          # New V2 utilities

❌ Don't Touch V1 Code:
src/components/     # Original V1 components
src/contexts/       # Original V1 contexts
src/pages/          # Original V1 pages
```

## 🔧 Development Commands

```bash
# Daily Development
npm run dev:v2        # Start V2 dev server
npm run dev:v1        # Start V1 dev server (to compare)

# Building
npm run build:v2      # Build V2 for beta
npm run build:v1      # Build V1 for production

# Deployment
npm run deploy:beta   # Deploy V2 to beta.coretet.app
npm run deploy:prod   # Deploy V1 to coretet.app

# Switching Modes
npm run v2           # Switch to V2 development
npm run v1           # Switch back to V1
```

## 🎯 Your First V2 Feature

Start with Phase 1 from your implementation plan:

### Create Project Database Tables

1. Create a new migration file:
```bash
touch database/migrations/v2_001_create_projects.sql
```

2. Add the SQL from your plan (the prompt you already wrote)

3. Run in Supabase SQL Editor

### Create ProjectContext

1. Create the context:
```bash
touch src/v2/contexts/ProjectContext.tsx
```

2. Use the Claude prompt from your plan to generate the code

### Create Project Components

1. Create component files:
```bash
touch src/v2/components/Projects/ProjectList.tsx
touch src/v2/components/Projects/ProjectCard.tsx
touch src/v2/components/Projects/ProjectView.tsx
```

2. Use your Claude prompts to generate each component

## 🧪 Testing V2 Features

### Local Testing
1. Run `npm run dev:v2`
2. Navigate to http://localhost:5173
3. You'll see the V2 dashboard placeholder
4. Replace placeholders with real components as you build

### Beta Testing
1. Push to develop branch:
```bash
git add .
git commit -m "feat(v2): add project hierarchy"
git push origin develop
```

2. Netlify auto-deploys to beta.coretet.app
3. Share beta link with trusted testers

## 📝 Important Files

- **`.env.local`** - Your local V2 settings
- **`src/config/features.ts`** - Feature flags control
- **`src/v2/README.md`** - V2 development guidelines
- **`src/v2/routes/V2Routes.tsx`** - V2 routing
- **`src/App.v2.tsx`** - V2 app entry point

## ⚠️ Safety Rules

1. **Never modify V1 components directly**
   - Copy to V2 folder if you need to modify
   - Prefix with V2 (e.g., `V2TrackList.tsx`)

2. **Database changes must be additive**
   - Add new columns as nullable
   - Create new tables, don't modify existing
   - Use migrations with rollback plans

3. **Test on beta before merging to main**
   - Always deploy to beta.coretet.app first
   - Get feedback before production

4. **Keep feature flags updated**
   - New features start as `false`
   - Enable gradually as they're ready

## 🆘 Troubleshooting

### "V2 features not showing"
```javascript
// Check in browser console:
console.log(window.__CORETET_FEATURES__)
// Should show PROJECT_HIERARCHY: true
```

### "Build failing"
```bash
# Try building V1 to isolate issue
npm run build:v1

# If V1 works but V2 doesn't, check imports:
# Make sure V2 components import from correct paths
```

### "Beta site not updating"
1. Check Netlify dashboard for build status
2. Make sure you pushed to `develop` branch
3. Check build logs for errors

## 📅 Next Steps Checklist

- [ ] Copy .env.v2.example to .env.local
- [ ] Add Supabase credentials to .env.local
- [ ] Test V2 mode locally with `npm run dev:v2`
- [ ] Set up beta.coretet.app on Netlify
- [ ] Create first V2 component in src/v2/
- [ ] Push to develop branch
- [ ] Verify beta site is live
- [ ] Start Phase 1 implementation

---

**Remember**: V1 users at coretet.app won't see any V2 changes until you explicitly merge and enable features. The beta site is your safe playground!