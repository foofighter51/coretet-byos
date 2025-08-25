# Coretet Beta: Simplification & Focus Brief

## Agent Guidelines & Approach

**Required Perspective:** Approach all tasks from the POV of an experienced coding/dev team with particular focus on UI/UX considerations. Don't just execute requests - engage in dialogue to make the best, most well-thought-out decisions.

**Interaction Style:**
- Ask clarifying questions to understand full context
- Consider user experience implications of any changes  
- Propose alternatives when you see potential improvements
- Think about edge cases and how changes affect existing workflows
- Maintain consistency with established design system and patterns

## Core Problem: "Homermobile" Syndrome

### Original Use Case (Simple & Clear)
- **Primary Goal:** Easily share tracks with bandmates
- **Core Features Needed:**
  - Quick track sharing via links/invites
  - Useful dialogue tools (ratings, comments)
  - Playlist organization by setlists/rehearsals
  - Eventually: arrangement marking (verse, chorus, bridge, etc.)

### What We Built Instead (Over-Engineered)
**Complex Feature Set:**
- 6 track categories (Songs, Demos, Ideas, Voice Memos, Final Versions, Live Performances)
- 6 theme options
- Task management system  
- 26 genres with multi-select
- Admin dashboard with storage quotas (Free/Premium/Admin tiers)
- Complex metadata (tempo, key, time signature)
- Tutorial/onboarding system
- PWA capabilities
- Comprehensive library management

**Technical Stack (Current):**
- React 18.3.1 with TypeScript
- Supabase (PostgreSQL + Storage + Auth)
- Tailwind CSS with forest theme
- Complex state management (5 context providers)
- Sophisticated audio handling system

## Key "Homermobile" Elements Identified

### 1. Category Overthinking
- **Current:** 6 categories for different track types
- **Reality:** Bands probably need "Songs" and maybe "Demos"

### 2. Feature Creep
- **Task Management:** Doesn't belong in music sharing app
- **Storage Tiers:** Adds complexity without solving core need
- **Theme Options:** One good theme > choice paralysis

### 3. Metadata Complexity  
- **Current:** Key, tempo, time signature, 26 genres
- **Reality:** Might be overkill for demo sharing between bandmates

### 4. Missing Core Features
- **Comments System:** Critical for dialogue, but not implemented
- **Simple Setlist Organization:** Unclear how current playlists serve this

## Critical Questions for Beta Direction

### User Definition
1. **Scope:** Just your bandmates, or other bands using this?
2. **Scale:** How many users per band typically?
3. **Technical Level:** Are users tech-savvy or need extreme simplicity?

### Workflow Clarification  
1. **Typical Flow:** Record demo → upload → share link → get feedback → rehearse?
2. **Sharing Method:** Email invites? Direct links? In-app notifications?
3. **Feedback Loop:** What does "useful dialogue" look like in practice?

### Setlist Organization
1. **Structure:** Playlists named by date/venue, or something more formal?
2. **Integration:** How do setlists connect to rehearsal workflow?
3. **Arrangement Marking:** Priority level? Essential or nice-to-have?

### Technical Constraints
1. **Current Infrastructure:** Keep Supabase or consider simpler alternatives?
2. **Mobile Requirements:** Native apps needed or web-first sufficient?
3. **Offline Needs:** Must work without internet during rehearsals?

## Proposed Beta Approach: "Band Demo Sharing" Focus

### Core Philosophy Shift
- **From:** "Universal Music Library Management"  
- **To:** "Band Demo Sharing & Collaboration"

### Essential Features Only
1. **Track Upload/Share:** Dead simple, instant links
2. **Comments/Ratings:** Real dialogue tools
3. **Setlist Playlists:** Organized by rehearsal/show
4. **Basic Organization:** Minimal categories, maximum utility

### Features to Question/Remove
- Complex metadata fields
- Task management
- Multiple themes  
- Storage tier management
- Tutorial systems
- Admin dashboards
- PWA complexity

## Success Criteria for Beta

### User Experience
- **5-minute setup:** Band member can join and share first track
- **Zero learning curve:** Intuitive without tutorials
- **Mobile-friendly:** Works great on phones during rehearsals

### Core Workflows  
- **Demo Sharing:** Record → Upload → Share → Get Feedback (< 2 minutes)
- **Setlist Prep:** Create rehearsal playlist → Share with band → Everyone prepared
- **Feedback Loop:** Listen → Comment → Rate → Iterate

### Technical Goals
- **Simplified Codebase:** Remove unnecessary complexity
- **Fast Performance:** Prioritize speed over features
- **Reliable Sharing:** Sharing must work 100% of the time

## Implementation Strategy

### Phase 1: Audit & Strip Down
- Remove unused features from current codebase
- Simplify data models to essential fields only
- Streamline UI to core workflows

### Phase 2: Focus on Missing Essentials  
- Implement robust comments system
- Perfect the sharing experience
- Optimize for mobile/rehearsal use cases

### Phase 3: Polish Core Experience
- Ensure everything works flawlessly
- Test with real bands
- Refine based on actual usage

## Questions for Development Team

1. **Architecture Decision:** Build from current codebase or start fresh?
2. **Feature Priority:** Which current features are genuinely useful vs. bloat?
3. **User Testing:** How can we validate assumptions with real musicians?
4. **Migration Path:** If successful, how does Beta relate to main project?

---

**Goal:** Create a focused, essential tool that bands actually want to use, rather than a feature-rich platform they find overwhelming. Think "WhatsApp for band demos" rather than "Spotify for professionals."