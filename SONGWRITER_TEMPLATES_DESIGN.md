# Songwriter Templates System Design

## Concept
Different musicians need different metadata fields and features. A guitar-based songwriter has vastly different needs from a piano composer or electronic producer.

## Template Profiles

### 🎸 Guitar/String Instruments
**Visible Fields:**
- Title, Artist, Album
- Key (with sharps: C#, F#, etc.)
- **Tuning** (prominently displayed)
- Capo position (new field)
- Tempo
- Time Signature
- Chord progression notation (new field)

**Hidden/Optional:**
- MIDI settings
- BPM sync options
- Electronic production fields

**Special Features:**
- Tab notation support
- Chord diagram attachments
- Alternate tuning library

### 🎹 Piano/Keyboard
**Visible Fields:**
- Title, Artist, Album
- **Key (with flats: Db, Eb, Bb, etc.)**
- Tempo
- Time Signature
- Pedal markings (new field)
- Dynamic markings (new field)

**Hidden/Optional:**
- Tuning (not applicable)
- Capo position
- Guitar-specific fields

**Special Features:**
- Sheet music attachments
- Classical notation preferences
- Voicing notes

### 🎛️ Electronic/Producer
**Visible Fields:**
- Title, Artist/Producer, Album/Release
- **BPM** (prominently displayed)
- Key
- DAW Project (new field)
- Sample Pack Used (new field)
- Plugin Chain (new field)

**Hidden/Optional:**
- Tuning
- Traditional instrument fields
- Acoustic considerations

**Special Features:**
- Stem separation tracking
- Mix version management
- Sample library integration

### 🎤 Vocalist/Singer-Songwriter
**Visible Fields:**
- Title, Artist, Album
- **Key** (for vocal range)
- **Lyrics** (prominently displayed)
- Vocal Range Required (new field)
- Harmony Parts (new field)

**Hidden/Optional:**
- Tuning (unless also playing)
- Technical production fields

**Special Features:**
- Lyric version tracking
- Vocal melody notation
- Pronunciation notes

### 🥁 Drummer/Percussionist
**Visible Fields:**
- Title, Artist, Album
- **Tempo/BPM** (critical)
- **Time Signature** (prominently displayed)
- Groove/Feel (new field)
- Kit Setup (new field)

**Hidden/Optional:**
- Key
- Tuning
- Harmonic information

**Special Features:**
- Click track management
- Drum notation
- Pattern library

### 🎼 Classical/Orchestral
**Visible Fields:**
- Title, Composer, Opus/Work Number
- **Key (with proper classical notation)**
- Movement/Section
- Instrumentation (new field)
- Performance Markings (new field)

**Hidden/Optional:**
- Modern production fields
- Electronic elements

**Special Features:**
- Score attachments
- Part extraction
- Performance notes

## Implementation Plan

### Phase 1: User Preferences
```sql
CREATE TABLE user_songwriter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type TEXT CHECK (template_type IN (
    'guitarist', 'pianist', 'producer', 
    'vocalist', 'drummer', 'classical', 'custom'
  )),
  preferences JSONB, -- Store field visibility, notation preferences, etc.
  key_notation TEXT DEFAULT 'sharps' CHECK (key_notation IN ('sharps', 'flats')),
  show_tuning BOOLEAN DEFAULT false,
  show_capo BOOLEAN DEFAULT false,
  show_lyrics_prominent BOOLEAN DEFAULT false,
  show_tempo_prominent BOOLEAN DEFAULT false,
  custom_fields JSONB, -- User-defined additional fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Phase 2: Dynamic Field System
```typescript
interface SongwriterTemplate {
  type: 'guitarist' | 'pianist' | 'producer' | 'vocalist' | 'drummer' | 'classical' | 'custom';
  visibleFields: string[];
  prominentFields: string[]; // Shown larger/first
  hiddenFields: string[];
  customFields: CustomField[];
  preferences: {
    keyNotation: 'sharps' | 'flats';
    defaultTimeSignature?: string;
    defaultTempo?: number;
    // ... other defaults
  };
}

interface CustomField {
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  options?: string[]; // For select fields
  required?: boolean;
  placeholder?: string;
}
```

### Phase 3: Template Selection UI

**First-Time Setup:**
1. "Welcome! What type of songwriter are you?"
2. Show template options with icons
3. Allow customization after selection
4. Save as default profile

**Settings Page:**
- Switch templates
- Customize current template
- Create custom template
- Import/export templates

### Phase 4: Smart Defaults

Based on template selection:
- **Guitarist**: Default to "Standard" tuning, show chord diagrams
- **Pianist**: Use flat notation, hide tuning field completely
- **Producer**: Default 120 BPM, show DAW integration
- **Vocalist**: Prominent lyrics editor, vocal range helper

### Phase 5: Field Visibility Logic

```typescript
// In TrackDetailsPanel
const getVisibleFields = (template: SongwriterTemplate) => {
  const allFields = ['title', 'artist', 'album', 'key', 'tempo', 'tuning', ...];
  
  return allFields.filter(field => 
    !template.hiddenFields.includes(field) &&
    (template.visibleFields.includes(field) || 
     template.prominentFields.includes(field))
  );
};

// Conditional rendering
{template.visibleFields.includes('tuning') && (
  <TuningField prominent={template.prominentFields.includes('tuning')} />
)}
```

## Benefits

1. **Cleaner UI**: Only see relevant fields for your instrument
2. **Faster Input**: Prominent fields for your workflow
3. **Better Defaults**: Smart suggestions based on your type
4. **Flexibility**: Switch templates or customize as needed
5. **Collaboration**: Understand what matters to other musicians

## Future Enhancements

- **Band Templates**: Combine multiple templates for bands
- **Genre Templates**: Jazz, Classical, Metal, etc.
- **Project Templates**: Album, EP, Single, Demo
- **Workflow Templates**: Writing, Recording, Mixing, Mastering
- **AI Suggestions**: Learn from usage patterns

## Migration Strategy

1. Add template system without breaking existing UI
2. Default all existing users to "custom" with all fields visible
3. Prompt users to select template on next login
4. Gradually introduce template-specific features