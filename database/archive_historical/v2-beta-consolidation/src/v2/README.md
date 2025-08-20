# CoreTet V2 - Songwriter Platform

## 📁 Directory Structure

This `/v2` directory contains all new features for CoreTet 2.0, keeping them separate from V1 code.

```
src/v2/
├── components/          # V2-specific React components
│   ├── Projects/       # Project management UI
│   ├── Versions/       # Version control UI
│   ├── Collaboration/ # Real-time collaboration features
│   └── Analysis/       # Audio intelligence features
├── contexts/           # V2 React contexts
├── hooks/              # V2 custom hooks
├── services/           # V2 business logic & API calls
├── types/              # V2 TypeScript definitions
└── utils/              # V2 utility functions
```

## 🎯 Development Guidelines

### Component Naming
- Prefix with `V2` when there's a V1 equivalent
- Example: `V2TrackList.tsx` vs original `TrackList.tsx`

### Import Patterns
```typescript
// Import from V2
import { ProjectContext } from '@/v2/contexts/ProjectContext';

// Import shared/V1 components
import { Button } from '@/components/UI/Button';

// Import V1 utilities (if needed)
import { formatDate } from '@/utils/date';
```

### File Organization
Each feature should be self-contained:
```
Projects/
├── ProjectList.tsx       # Main component
├── ProjectCard.tsx       # Sub-component
├── ProjectView.tsx       # Detail view
├── ProjectContext.tsx    # Feature context
├── useProjects.ts       # Feature hook
├── types.ts             # Feature types
└── utils.ts             # Feature utilities
```

## 🔄 Integration Points

### Using V2 Features in Main App
```typescript
// src/App.tsx
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { ProjectView } from './v2/components/Projects/ProjectView';
import { PlaylistView } from './components/Playlists/PlaylistView';

function App() {
  const { isV2Enabled } = useFeatureFlags();
  
  return isV2Enabled ? <ProjectView /> : <PlaylistView />;
}
```

### Database Schema
V2 uses additional tables without modifying V1:
- `projects` - New project organization
- `song_versions` - Version control
- `version_iterations` - Individual takes
- `project_collaborators` - Team members

## 🚀 Current Implementation Status

### Phase 1: Project Hierarchy ⏳
- [ ] Database schema
- [ ] ProjectContext provider
- [ ] Project UI components
- [ ] Migration utilities

### Phase 2: Collaboration 📋
- [ ] Timestamped comments
- [ ] Version comparison
- [ ] Real-time presence
- [ ] Suggestion system

### Phase 3: Audio Intelligence 🔮
- [ ] Audio analysis
- [ ] Smart search
- [ ] Auto-tagging
- [ ] Pattern detection

### Phase 4: Mobile & Polish 📱
- [ ] Mobile optimization
- [ ] Performance improvements
- [ ] Multiple view modes
- [ ] Onboarding flow

## 🧪 Testing V2 Features

1. **Local Development**
   ```bash
   VITE_FEATURE_V2=true npm run dev
   ```

2. **Beta Site**
   - URL: https://beta.coretet.app
   - Branch: develop
   - Auto-deploys on push

3. **Feature Flags**
   - Check `src/config/features.ts`
   - Toggle in `.env.local`

## 📝 Notes

- Keep V1 functionality intact
- All V2 code is additive, not destructive
- Test thoroughly before merging to main
- Document breaking changes