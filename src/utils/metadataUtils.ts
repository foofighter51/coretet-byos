// Utility functions for handling extended metadata

export interface ExtendedMetadata {
  // Music Theory
  scale?: string;
  mode?: string;
  energyLevel?: string;
  instruments?: string;
  arrangement?: string;
  
  // Production
  producer?: string;
  engineer?: string;
  studio?: string;
  recordingDate?: string;
  mixingEngineer?: string;
  masteringEngineer?: string;
  sessionMusicians?: string;
  
  // Technical
  sampleRate?: string;
  bitRate?: string;
  fileFormat?: string;
  codec?: string;
  channels?: string;
  loudness?: string;
  
  // Rights & Licensing
  isrc?: string;
  publisher?: string;
  label?: string;
  copyright?: string;
  licenseType?: string;
  rightsHolder?: string;
  
  // External Links
  spotifyUrl?: string;
  appleMusicUrl?: string;
  soundcloudUrl?: string;
  youtubeUrl?: string;
  bandcampUrl?: string;
  websiteUrl?: string;
  
  // Live Performance
  venue?: string;
  eventDate?: string;
  performers?: string;
  soundEngineer?: string;
  audience?: string;
  setlistPosition?: string;
  
  // Demo/Idea specific
  version?: string;
  projectFile?: string;
  collaborators?: string;
  concept?: string;
  influences?: string;
  targetProject?: string;
  
  // Voice Memo specific
  location?: string;
  device?: string;
  originalIdea?: string;
  
  // Lyrics
  lyrics?: string;
}

export interface TrackNotes {
  notes?: string;
  extended?: ExtendedMetadata;
}

export const parseTrackNotes = (notesString?: string): TrackNotes => {
  if (!notesString) return { notes: '', extended: {} };
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(notesString);
    if (typeof parsed === 'object' && parsed.extended) {
      return parsed;
    }
    // If it's just a plain object, treat it as extended metadata
    if (typeof parsed === 'object') {
      return { notes: '', extended: parsed };
    }
  } catch {
    // If not JSON, treat as plain text notes
    return { notes: notesString, extended: {} };
  }
  
  return { notes: notesString, extended: {} };
};

export const stringifyTrackNotes = (trackNotes: TrackNotes): string => {
  if (!trackNotes.extended || Object.keys(trackNotes.extended).length === 0) {
    return trackNotes.notes || '';
  }
  
  return JSON.stringify(trackNotes, null, 2);
};

export const getExtendedValue = (notesString: string | undefined, field: keyof ExtendedMetadata): string => {
  const { extended } = parseTrackNotes(notesString);
  return extended?.[field] || '';
};

export const setExtendedValue = (
  notesString: string | undefined, 
  field: keyof ExtendedMetadata, 
  value: string
): string => {
  const trackNotes = parseTrackNotes(notesString);
  if (!trackNotes.extended) {
    trackNotes.extended = {};
  }
  
  if (value) {
    trackNotes.extended[field] = value;
  } else {
    delete trackNotes.extended[field];
  }
  
  return stringifyTrackNotes(trackNotes);
};

// Metadata templates for different track types
export const metadataTemplates = {
  'final-versions': {
    name: 'Release Ready',
    description: 'For finished tracks ready for release',
    fields: {
      producer: '',
      engineer: '',
      studio: '',
      recordingDate: '',
      mixingEngineer: '',
      masteringEngineer: '',
      isrc: '',
      publisher: '',
      label: '',
      copyright: ''
    }
  },
  'demos': {
    name: 'Demo',
    description: 'For work-in-progress tracks',
    fields: {
      recordingDate: '',
      instruments: '',
      collaborators: '',
      version: '1.0',
      projectFile: '',
      concept: ''
    }
  },
  'live-performances': {
    name: 'Live Recording',
    description: 'For live performance recordings',
    fields: {
      venue: '',
      eventDate: '',
      performers: '',
      soundEngineer: '',
      audience: '',
      setlistPosition: ''
    }
  },
  'voice-memos': {
    name: 'Voice Memo',
    description: 'For quick voice recordings',
    fields: {
      recordingDate: new Date().toISOString().split('T')[0],
      location: '',
      device: '',
      originalIdea: ''
    }
  },
  'ideas': {
    name: 'Idea Sketch',
    description: 'For musical ideas and sketches',
    fields: {
      concept: '',
      instruments: '',
      influences: '',
      targetProject: '',
      energyLevel: ''
    }
  },
  'songs': {
    name: 'Song',
    description: 'General song template',
    fields: {
      genre: '',
      mood: '',
      key: '',
      tempo: '',
      timeSignature: '4/4'
    }
  }
};

export const applyMetadataTemplate = (
  notesString: string | undefined,
  template: keyof typeof metadataTemplates
): string => {
  const trackNotes = parseTrackNotes(notesString);
  const templateData = metadataTemplates[template];
  
  if (!templateData) return notesString || '';
  
  trackNotes.extended = {
    ...trackNotes.extended,
    ...templateData.fields
  };
  
  return stringifyTrackNotes(trackNotes);
};