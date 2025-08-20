# CoreTet V2 Development Strategy - Safe Implementation Guide

## 🎯 Overview
This guide outlines best practices for developing CoreTet V2 alongside the live V1, ensuring zero disruption to beta testers while building the songwriter platform features.

## 🔀 Development Approach Options

### Option 1: Feature Branch Strategy (RECOMMENDED)
**Best for: Your current setup with limited experience**

```
main (v1 - live)
  └── develop (v2 - new features)
       ├── feature/project-hierarchy
       ├── feature/version-system
       └── feature/collaboration
```

#### Implementation:
```bash
# Create development branch
git checkout -b develop

# Create feature branches from develop
git checkout -b feature/project-hierarchy

# Regular syncing to keep V2 updated with V1 fixes
git checkout develop
git merge main  # Get V1 bug fixes
```

#### Deployment Setup:
```bash
# Two Netlify sites
coretet.app         → main branch (V1 - stable)
beta.coretet.app    → develop branch (V2 - testing)
```

### Option 2: Feature Flags (Advanced)
**Best for: Gradual rollout to specific users**

```typescript
// src/config/features.ts
export const FEATURES = {
  PROJECT_HIERARCHY: process.env.VITE_ENABLE_PROJECTS === 'true',
  VERSION_SYSTEM: process.env.VITE_ENABLE_VERSIONS === 'true',
  AI_ANALYSIS: process.env.VITE_ENABLE_AI === 'true',
};

// Usage in components
import { FEATURES } from '@/config/features';

function App() {
  return (
    <>
      {FEATURES.PROJECT_HIERARCHY ? (
        <ProjectView />  // V2 feature
      ) : (
        <PlaylistView /> // V1 feature
      )}
    </>
  );
}
```

### Option 3: Monorepo Structure
**Best for: Complete separation (more complex)**

```
coretet/
  ├── packages/
  │   ├── v1/  (current app)
  │   ├── v2/  (new features)
  │   └── shared/  (common code)
  └── apps/
      ├── production/  (v1)
      └── beta/  (v2)
```

## 📋 Recommended Implementation Plan

### Phase 0: Setup (Week 1)

#### 1. Create Beta Environment
```bash
# Clone existing project for V2 development
cd ~/Apps
cp -r coretet_no_ai coretet_v2

# Or use same repo with branches
cd coretet_no_ai
git checkout -b develop
```

#### 2. Setup Beta Subdomain in Netlify
1. Create new Netlify site: `coretet-beta`
2. Link to same GitHub repo
3. Set deploy branch to `develop`
4. Configure subdomain: `beta.coretet.app`

#### 3. Database Strategy
```sql
-- Option A: Separate schema (RECOMMENDED)
CREATE SCHEMA v2;

-- V2 tables in new schema
CREATE TABLE v2.projects (...);
CREATE TABLE v2.song_versions (...);

-- V1 tables remain untouched in public schema
```

```typescript
// Supabase client for V2
export const supabaseV2 = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    db: { schema: 'v2' }
  }
);
```

### Phase 1: Safe Feature Development

#### 1. Environment Variables
```env
# .env.v1 (production)
VITE_APP_VERSION=1.0
VITE_API_SCHEMA=public
VITE_FEATURE_FLAGS=false

# .env.v2 (beta)
VITE_APP_VERSION=2.0
VITE_API_SCHEMA=v2
VITE_FEATURE_FLAGS=true
```

#### 2. Backward Compatible Database
```sql
-- Add new columns as nullable
ALTER TABLE tracks 
ADD COLUMN project_id UUID NULL,
ADD COLUMN version_number VARCHAR(20) NULL;

-- Create new tables without breaking old ones
CREATE TABLE IF NOT EXISTS projects (...);

-- Create views for backward compatibility
CREATE VIEW v1_compatible_tracks AS
SELECT * FROM tracks WHERE project_id IS NULL;
```

#### 3. Progressive Enhancement Pattern
```typescript
// src/components/Library/TrackList.tsx
export function TrackList() {
  const isV2 = useFeatureFlag('PROJECT_MODE');
  
  if (isV2) {
    return <ProjectBasedTrackList />;  // New V2 component
  }
  
  return <ClassicTrackList />;  // Existing V1 component
}
```

### Phase 2: Testing Strategy

#### 1. User Segmentation
```typescript
// src/utils/userSegments.ts
export function getUserSegment(userId: string) {
  const betaUsers = [
    'user_id_1',  // Your test account
    'user_id_2',  // Trusted beta tester
  ];
  
  return betaUsers.includes(userId) ? 'beta' : 'stable';
}
```

#### 2. A/B Testing Setup
```typescript
// src/hooks/useExperiment.ts
export function useExperiment(experimentName: string) {
  const user = useAuth();
  const segment = getUserSegment(user.id);
  
  return {
    variant: segment === 'beta' ? 'v2' : 'v1',
    track: (event: string) => {
      // Track user interactions for analysis
    }
  };
}
```

### Phase 3: Migration Strategy

#### 1. Opt-in Migration
```typescript
// src/components/Migration/MigrationPrompt.tsx
export function MigrationPrompt() {
  return (
    <Modal>
      <h2>Try the New CoreTet Experience!</h2>
      <p>New features: Projects, Versions, Collaboration</p>
      <Button onClick={migrateToV2}>Upgrade My Account</Button>
      <Button variant="secondary">Maybe Later</Button>
    </Modal>
  );
}
```

#### 2. Data Migration Script
```typescript
// src/utils/migration/migrateUserToV2.ts
export async function migrateUserToV2(userId: string) {
  // 1. Copy user data to V2 schema
  // 2. Transform playlists to projects
  // 3. Set user preference flag
  // 4. Keep V1 data intact for rollback
}
```

## 🛡️ Safety Measures

### 1. Database Backups
```bash
# Daily automated backups before V2 work
pg_dump -h your-db-host -U user -d coretet > backup_$(date +%Y%m%d).sql

# Supabase automatic backups (verify enabled)
# Dashboard → Settings → Backups
```

### 2. Rollback Plan
```typescript
// Quick rollback switch
export const APP_VERSION = process.env.VITE_FORCE_V1 ? 'v1' : 'v2';

// Database rollback
-- Revert schema changes
DROP SCHEMA v2 CASCADE;
-- Remove new columns
ALTER TABLE tracks DROP COLUMN IF EXISTS project_id;
```

### 3. Monitoring Setup
```typescript
// src/utils/monitoring.ts
export function trackError(error: Error, context: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry or similar
    Sentry.captureException(error, {
      tags: {
        version: APP_VERSION,
        feature: context.feature
      }
    });
  }
}
```

## 📝 Development Workflow

### Daily Development Process
```bash
# 1. Start your day
git checkout develop
git pull origin develop
git merge main  # Get any V1 hotfixes

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Develop with live reload
npm run dev  # Runs on localhost:5173

# 4. Test your changes
npm run test
npm run build  # Ensure build succeeds

# 5. Push to feature branch
git add .
git commit -m "feat: implement songwriter projects"
git push origin feature/your-feature

# 6. Deploy to beta
git checkout develop
git merge feature/your-feature
git push origin develop  # Auto-deploys to beta.coretet.app
```

### Testing Checklist
- [ ] Feature works in development
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Doesn't break V1 features
- [ ] Database migrations are reversible
- [ ] Loading states implemented
- [ ] Error handling in place

## 🚦 Go-Live Strategy

### Soft Launch (Recommended)
1. **Week 1-2**: Internal testing on beta.coretet.app
2. **Week 3-4**: Invite 5-10 trusted beta users
3. **Week 5-6**: Open beta to all users (opt-in)
4. **Week 7-8**: Make V2 default for new users
5. **Week 9+**: Migrate existing users (with option to stay on V1)

### Communication Plan
```markdown
# Email to Beta Users
Subject: You're Invited: Test CoreTet 2.0!

We're building something special - a complete songwriter's workspace.
Try it at: beta.coretet.app

New Features:
- Project organization
- Version control for songs
- Real-time collaboration
- AI-powered insights

Your current music is safe at coretet.app
```

## 🔧 Technical Implementation Tips

### 1. Component Organization
```
src/
  ├── components/
  │   ├── v1/        # Keep V1 components untouched
  │   ├── v2/        # New V2 components
  │   └── shared/    # Common components
  └── pages/
      ├── v1/        # V1 pages
      └── v2/        # V2 pages
```

### 2. Route Management
```typescript
// src/App.tsx
function App() {
  const version = useAppVersion();
  
  return (
    <Routes>
      {version === 'v2' ? (
        <Route path="/*" element={<V2App />} />
      ) : (
        <Route path="/*" element={<V1App />} />
      )}
    </Routes>
  );
}
```

### 3. Style Isolation
```scss
// V2 specific styles with namespace
.v2-app {
  // New styles that won't affect V1
  .project-card { }
  .version-timeline { }
}

// Keep V1 styles unchanged
.v1-app {
  // Existing styles
}
```

## 📊 Success Metrics

### Track These Metrics
1. **Stability**: V1 uptime remains 99.9%
2. **Adoption**: % of users trying V2
3. **Retention**: Users staying on V2 vs reverting
4. **Performance**: Page load times for both versions
5. **Errors**: Error rate comparison V1 vs V2
6. **Feedback**: User satisfaction scores

## 🆘 Troubleshooting Guide

### Common Issues & Solutions

#### "I broke something in V1!"
```bash
# Quick revert
git checkout main
git reset --hard origin/main
netlify deploy --prod  # Emergency redeploy
```

#### "Database migration failed"
```sql
-- Always create reversible migrations
BEGIN;
-- Your changes
SAVEPOINT before_change;
-- Test the change
-- If it fails:
ROLLBACK TO before_change;
-- If it works:
COMMIT;
```

#### "Users can't access V2 features"
```typescript
// Check feature flags
console.log('Feature flags:', {
  projectsEnabled: FEATURES.PROJECT_HIERARCHY,
  userSegment: getUserSegment(userId),
  appVersion: APP_VERSION
});
```

## 📚 Resources & Commands

### Useful Commands Library
```bash
# Check which version is deployed
curl https://coretet.app/version.json
curl https://beta.coretet.app/version.json

# Local development with V2 features
VITE_APP_VERSION=2 npm run dev

# Build for V1 production
VITE_APP_VERSION=1 npm run build

# Run V1 and V2 simultaneously (different ports)
PORT=5173 npm run dev  # V1
PORT=5174 VITE_APP_VERSION=2 npm run dev  # V2

# Database backup
pg_dump $(heroku config:get DATABASE_URL) > backup.sql

# Deploy to specific environment
netlify deploy --prod --site=coretet-v1
netlify deploy --prod --site=coretet-beta
```

### Environment Files Structure
```
coretet_no_ai/
  ├── .env.local       # Your local development
  ├── .env.v1          # V1 production settings
  ├── .env.v2          # V2 beta settings
  └── .env.example     # Template for team
```

## ✅ Pre-Development Checklist

Before starting V2 development:

- [ ] Create `develop` branch
- [ ] Set up beta.coretet.app on Netlify
- [ ] Configure separate deployment pipeline
- [ ] Create V2 database schema or tables
- [ ] Set up error tracking (Sentry free tier)
- [ ] Document rollback procedure
- [ ] Inform beta testers about beta site
- [ ] Create feedback collection method
- [ ] Set up A/B testing framework
- [ ] Backup current V1 database

## 🎯 Next Steps

1. **Today**: Set up beta environment
2. **This Week**: Implement first V2 feature on beta
3. **Next Week**: Invite yourself and 1 trusted user to test
4. **In 2 Weeks**: Open beta to more users
5. **In 1 Month**: Evaluate and plan wider rollout

---

*Remember: The goal is evolution, not revolution. V1 users should never notice V2 development until they choose to upgrade.*

*Last Updated: August 2025*