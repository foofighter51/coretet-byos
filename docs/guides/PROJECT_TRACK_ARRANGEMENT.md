# Track Arrangement Component Project

## Project Overview
A standalone React application to explore and develop advanced track arrangement features including waveform visualization, section marking, and multi-track arrangement capabilities. This project is designed to integrate seamlessly with the existing Coretet music library application.

## Existing Coretet Context

### Current Tech Stack
- **Frontend**: React 18.3.1 + TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1 (custom forest theme)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Context API
- **Routing**: React Router DOM 7.7.0
- **Icons**: Lucide React 0.344.0
- **Audio**: HTML5 Audio API (basic player currently)

### Relevant Existing Features
- **Track Management**: Upload, categorize, tag tracks
- **Audio Storage**: Supabase Storage (audio-files bucket)
- **Playback**: Basic audio player with transport controls
- **Database Tables**: `tracks`, `playlists`, `playlist_tracks`, `profiles`
- **Auth**: Supabase Auth with email/password
- **Design System**: Forest theme with dark green palette

### Integration Points
- **LibraryContext**: Central state management for tracks
- **AudioContext**: Current playback state and controls
- **Track Type**: Existing TypeScript interface for track data
- **Supabase Client**: Configured at `src/lib/supabase.ts`

## Core Features to Explore

### 1. Waveform Visualization & Interaction
- **Advanced Waveform Rendering**
  - High-resolution waveform display using Web Audio API
  - Zoom in/out capabilities (sample-level to full track)
  - Multiple visualization modes (peaks, RMS, spectral)
  - Real-time playback position indicator
  - Smooth scrolling and panning

- **Interactive Markers**
  - Click-to-place section markers
  - Drag markers to adjust position
  - Snap-to-grid / snap-to-transient options
  - Marker labels and colors
  - Keyboard shortcuts for precise positioning

### 2. Section Management
- **Section Types**
  - Intro, Verse, Chorus, Bridge, Outro
  - Custom section types
  - Color-coded visualization
  - Section templates (save/load common structures)

- **Section Operations**
  - Create/delete sections
  - Resize sections by dragging boundaries
  - Copy/paste sections
  - Loop sections for playback
  - Export individual sections

### 3. Multi-Track Arrangement
- **Track Lanes**
  - Multiple track lanes (vertical stack)
  - Synchronized playback across tracks
  - Individual track controls (mute/solo/volume)
  - Track grouping and folders

- **Cross-Track Operations**
  - Copy sections between tracks
  - Align sections across tracks
  - Create composite arrangements
  - A/B comparison views
  - Master timeline with all tracks

### 4. Arrangement Tools
- **Timeline Features**
  - Beat grid overlay
  - Tempo detection and display
  - Time signature markers
  - Measure/bar numbers
  - Multiple time formats (samples, seconds, bars)

- **Editing Tools**
  - Cut/copy/paste sections
  - Crossfade between sections
  - Time-stretch sections
  - Arrangement templates
  - Undo/redo with history

## Technical Stack

### Dependencies to Add (Beyond Coretet's Existing)
```json
{
  "new-dependencies": {
    "wavesurfer.js": "^7.8.0",        // Advanced waveform viz
    "peaks.js": "^3.4.0",              // Alternative waveform editor
    "tone": "^14.7.77",                // Web Audio wrapper
    "react-dnd": "^16.0.1",            // Drag-drop sections
    "react-dnd-html5-backend": "^16.0.1"
  },
  "existing-in-coretet": {
    "react": "^18.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "@supabase/supabase-js": "^2.45.4",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.344.0",
    "react-router-dom": "^7.7.0"
  }
}
```

### Key Libraries Explained
- **WaveSurfer.js**: Primary waveform visualization
- **Peaks.js**: Alternative BBC-developed waveform editor
- **Tone.js**: Web Audio API wrapper for playback control
- **React DnD**: Drag-and-drop for sections
- **Zustand**: State management for arrangement data
- **React Query**: Server state and caching

## Project Structure

```
track-arrangement-explorer/
├── src/
│   ├── components/
│   │   ├── Waveform/
│   │   │   ├── WaveformDisplay.tsx
│   │   │   ├── WaveformControls.tsx
│   │   │   ├── PlaybackCursor.tsx
│   │   │   └── ZoomControls.tsx
│   │   ├── Sections/
│   │   │   ├── SectionMarker.tsx
│   │   │   ├── SectionEditor.tsx
│   │   │   ├── SectionList.tsx
│   │   │   └── SectionTemplates.tsx
│   │   ├── Timeline/
│   │   │   ├── TimelineRuler.tsx
│   │   │   ├── BeatGrid.tsx
│   │   │   ├── TimeDisplay.tsx
│   │   │   └── TempoMarkers.tsx
│   │   ├── Arrangement/
│   │   │   ├── ArrangementView.tsx
│   │   │   ├── TrackLane.tsx
│   │   │   ├── MultiTrackSync.tsx
│   │   │   └── ArrangementExport.tsx
│   │   └── Controls/
│   │       ├── TransportControls.tsx
│   │       ├── EditTools.tsx
│   │       └── KeyboardShortcuts.tsx
│   ├── hooks/
│   │   ├── useWaveform.ts
│   │   ├── useAudioAnalysis.ts
│   │   ├── useArrangement.ts
│   │   └── usePlayback.ts
│   ├── utils/
│   │   ├── audioProcessing.ts
│   │   ├── waveformUtils.ts
│   │   ├── sectionUtils.ts
│   │   └── exportUtils.ts
│   ├── stores/
│   │   ├── arrangementStore.ts
│   │   ├── playbackStore.ts
│   │   └── uiStore.ts
│   └── types/
│       ├── arrangement.ts
│       ├── section.ts
│       └── waveform.ts
```

## Initial Setup Commands

```bash
# Create new Vite project
npm create vite@latest track-arrangement-explorer -- --template react-ts
cd track-arrangement-explorer

# Copy Coretet's configurations for consistency
cp ../coretet_no_ai/tailwind.config.js .
cp ../coretet_no_ai/postcss.config.js .
cp ../coretet_no_ai/tsconfig.json .
cp -r ../coretet_no_ai/src/lib/supabase.ts src/lib/

# Install dependencies
npm install wavesurfer.js peaks.js tone @tanstack/react-query zustand
npm install react-dnd react-dnd-html5-backend
npm install tailwindcss lucide-react
npm install -D @types/react @types/node

# Initialize Tailwind
npx tailwindcss init -p

# Start development
npm run dev
```

## Core Component Examples

### Basic Waveform Component
```typescript
// src/components/Waveform/WaveformDisplay.tsx
import WaveSurfer from 'wavesurfer.js';
import { useEffect, useRef } from 'react';

export const WaveformDisplay = ({ audioUrl }: { audioUrl: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#e4da38',
      progressColor: '#d27556',
      cursorColor: '#fff',
      barWidth: 2,
      responsive: true,
      plugins: [
        // Add regions plugin for sections
        // Add timeline plugin
        // Add markers plugin
      ]
    });

    wavesurferRef.current.load(audioUrl);

    return () => wavesurferRef.current?.destroy();
  }, [audioUrl]);

  return <div ref={containerRef} className="w-full h-32" />;
};
```

### Section Marker Type
```typescript
// src/types/section.ts
export interface Section {
  id: string;
  trackId: string;
  name: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'custom';
  startTime: number; // in seconds
  endTime: number;
  color: string;
  notes?: string;
}

export interface ArrangementData {
  id: string;
  name: string;
  tracks: TrackData[];
  sections: Section[];
  tempo?: number;
  timeSignature?: string;
}
```

## Development Roadmap

### Phase 1: Basic Waveform (Week 1)
- [ ] Set up project structure
- [ ] Implement basic waveform display
- [ ] Add playback controls
- [ ] Implement zoom/pan functionality

### Phase 2: Section Marking (Week 2)
- [ ] Add section marker UI
- [ ] Implement click-to-add markers
- [ ] Add section editing modal
- [ ] Implement section coloring

### Phase 3: Multi-Track Support (Week 3)
- [ ] Create track lane component
- [ ] Implement synchronized playback
- [ ] Add track controls (mute/solo)
- [ ] Build track arrangement view

### Phase 4: Advanced Features (Week 4)
- [ ] Add beat grid overlay
- [ ] Implement section templates
- [ ] Add arrangement export
- [ ] Create keyboard shortcuts

## Integration Plan with Coretet

### Database Schema Extensions
```sql
-- New tables to add to Supabase
CREATE TABLE arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  sections JSONB, -- Array of section objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE arrangement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  structure JSONB,
  is_public BOOLEAN DEFAULT false
);
```

### Integration Steps

1. **Phase 1: Standalone Development**
   - Build in isolation with mock data
   - Use same Tailwind config as Coretet
   - Match forest theme colors

2. **Phase 2: Coretet Connection**
   - Connect to existing Supabase instance
   - Use existing auth from useAuth hook
   - Load tracks via LibraryContext

3. **Phase 3: Component Migration**
   ```typescript
   // Add to existing Coretet structure
   src/components/
     Arrangement/           // New folder
       WaveformEditor.tsx
       SectionManager.tsx
       ArrangementView.tsx
   ```

4. **Phase 4: Context Integration**
   ```typescript
   // Extend existing AudioContext
   interface AudioContextValue {
     // Existing
     currentTrack: Track | null;
     isPlaying: boolean;
     // New additions
     waveformData?: Float32Array;
     sections?: Section[];
     loopSection?: Section;
   }
   ```

5. **Phase 5: Route Addition**
   ```typescript
   // Add to existing routes
   <Route path="/track/:id/arrange" element={<ArrangementEditor />} />
   ```

## Key Challenges to Solve

1. **Performance**
   - Efficient waveform rendering for long tracks
   - Smooth zoom/pan operations
   - Multi-track synchronization

2. **User Experience**
   - Intuitive marker placement
   - Clear visual feedback
   - Responsive controls

3. **Data Management**
   - Efficient section storage
   - Undo/redo implementation
   - Auto-save functionality

## Resources & References

- [WaveSurfer.js Documentation](https://wavesurfer-js.org/)
- [Peaks.js Documentation](https://github.com/bbc/peaks.js)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Tone.js Documentation](https://tonejs.github.io/)
- [React DnD Documentation](https://react-dnd.github.io/react-dnd/)

## Testing Strategy

- Unit tests for utility functions
- Component testing with React Testing Library
- E2E tests for arrangement workflows
- Performance benchmarking for large files
- Cross-browser compatibility testing

## Success Metrics

- Waveform loads < 2 seconds for 10-minute track
- Smooth playback with < 20ms latency
- Section markers accurate to 10ms
- Support for 10+ simultaneous tracks
- Arrangement operations < 100ms response time