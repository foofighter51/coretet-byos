# Arrangements Feature

The Arrangements feature allows users to mark sections within their audio tracks (intro, verse, chorus, etc.) and create different arrangements by reordering these sections.

## Features

### 1. **BPM-Based Grid System**
- Requires BPM to be set for the track
- Visual grid overlay under the waveform
- Snap-to-grid functionality (beat, bar, or 4-bar phrase)
- Grid lines show musical boundaries for precise section marking

### 2. **Section Marking**
- Click on waveform to mark section start/end points
- Sections snap to the nearest grid line
- Each section gets a color and name
- Edit section names inline
- Adjust section boundaries with resize handles

### 3. **Section Management**
- List view of all sections with timestamps
- Change section colors (6 color options)
- Delete sections
- Play individual sections (future enhancement)
- Quick templates for common sections (Intro, Verse, Chorus, etc.)

### 4. **Arrangement Builder** (Future Enhancement)
- Drag & drop sections to create arrangements
- Save multiple arrangements per track
- Export arrangements as new audio files

## Usage

1. **Set BPM**: In the track details, enter the BPM/Tempo for your track
2. **Open Arrangements**: Click "Edit Arrangements" button in track details
3. **Create Sections**: Click on the waveform to mark start and end of sections
4. **Edit Sections**: Click sections to select, edit names, change colors
5. **Manage Grid**: Toggle grid visibility and change snap settings

## Database Schema

The feature uses three tables:
- `audio_sections`: Stores section markers (name, start/end times, color)
- `arrangements`: Different arrangements of a track
- `arrangement_sections`: Links sections to arrangements in order

## Technical Implementation

### Components
- `ArrangementEditor`: Main container component
- `ArrangementWaveform`: Extended waveform with grid overlay
- `SectionMarker`: Visual section representation
- `SectionList`: Section management interface

### Key Features
- Real-time grid calculation based on BPM
- Snap-to-grid ensures clean loops
- Visual feedback for section boundaries
- Responsive design for different screen sizes

## Future Enhancements

1. **Section Playback**: Play individual sections in loop
2. **Arrangement Builder**: Drag & drop interface to reorder sections
3. **Export Arrangements**: Generate new audio files from arrangements
4. **Section Templates**: Pre-defined section structures (ABABCB, etc.)
5. **Collaborative Editing**: Multiple users can work on arrangements
6. **MIDI Export**: Export arrangement as MIDI markers