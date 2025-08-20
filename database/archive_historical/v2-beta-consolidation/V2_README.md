# CoreTet V2 Beta - Consolidated Files

This directory contains all V2/beta related files consolidated for transfer to a new project.

## Structure

### `/src/`
- `v2/` - Complete V2 source code including components, contexts, routes, types
- `App.v2.tsx` - V2 application entry point
- `main.v2.tsx` - V2 main React entry

### `/database/`
- All V2 database migrations and schema files
- Includes both active and archived migration files

### `/docs/`
- `V2_DEVELOPMENT_STRATEGY.md` - V2 development approach
- `V2_QUICK_START.md` - V2 setup guide
- `EOD_STATUS_V2_BETA_2025_08_09.md` - Latest V2 beta status

### `/scripts/`
- `switch-version.js` - Script to switch between V1 and V2

### `/config/`
- `.env.v2.example` - V2 environment configuration template

## Key V2 Features

Based on `EOD_STATUS_V2_BETA_2025_08_09.md`:

### Core Infrastructure
- Songwriter-focused redesign (vs album/label perspective)
- Works → Versions → Iterations hierarchy
- 5 V2 database tables: projects, song_versions, version_iterations, project_collaborators, version_metadata

### Components
- **SongwriterDashboard**: Clean entry with "Create a Work" or "Upload Audio"
- **CreateWorkModal**: Simple title + optional artist
- **WorkDetailEnhanced**: Comprehensive single-page work management
- **WorkVersionUpload**: Audio upload with version management
- **WorkNotes**: Timestamped notes system
- **WorkTasks**: Task management with priorities

### Status
- **Beta URL**: beta.coretet.app
- **Branch**: develop
- **Environment**: VITE_ENABLE_V2=true
- **Current Issue**: RLS policy recursion needs fix (v2_005_fix_projects_rls_recursion.sql)

## Next Steps for New Project

1. Apply RLS recursion fix migration
2. Implement audio playback and waveform visualization
3. Add collaboration features
4. Create onboarding flow
5. Test work creation and viewing

## Notes

The V2 beta represents a significant shift from the album/label perspective to a songwriter point of view, with simplified entry points that align with how artists think about their creative process.