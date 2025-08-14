# AI Analysis Integration Project

## Project Overview
A standalone React application to explore AI-powered music analysis features, including per-track analysis and library-wide insights, with multiple AI provider integrations. Designed to seamlessly integrate with the existing Coretet music library application.

## Existing Coretet Context

### Current Tech Stack
- **Frontend**: React 18.3.1 + TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1 (custom forest theme)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management**: React Context API
- **Audio Storage**: Supabase Storage (audio-files bucket)
- **Database**: PostgreSQL with Row Level Security

### Relevant Existing Infrastructure
- **Track Data Model**: `tracks` table with metadata fields
- **User System**: Supabase Auth with profiles
- **File Storage**: Existing audio file handling
- **Categories**: songs, demos, ideas, voice_memos, final_versions
- **Metadata Fields**: artist, collection, key, tempo, mood, genre, tags
- **LibraryContext**: Central state management
- **Toast System**: User feedback notifications

### Previous AI Features (Removed)
- Coretet previously had AI features that were removed for simplicity
- Users prefer manual control over automatic categorization
- Any new AI features should be opt-in and transparent

## Core Features to Explore

### 1. Per-Track Analysis
- **Audio Feature Extraction**
  - Key detection and confidence score
  - Tempo/BPM analysis
  - Time signature detection
  - Energy and dynamics mapping
  - Mood and emotion classification
  - Genre classification (multi-label)
  - Instrument detection

- **Structural Analysis**
  - Automatic section detection
  - Chorus/verse identification
  - Song structure mapping
  - Transition point detection
  - Repetition pattern analysis

- **Musical Elements**
  - Chord progression detection
  - Melody extraction
  - Harmonic analysis
  - Rhythm pattern identification
  - Vocal/instrumental detection

### 2. Library-Wide Analysis
- **Collection Insights**
  - Genre distribution
  - Tempo clustering
  - Key relationship mapping
  - Mood progression tracking
  - Temporal patterns (upload/creation trends)

- **Similarity & Recommendations**
  - Track similarity scoring
  - Automatic playlist generation
  - "Sounds like" recommendations
  - Duplicate/near-duplicate detection
  - Version/remix identification

- **Creative Analytics**
  - Productivity patterns
  - Style evolution over time
  - Collaboration insights
  - Most used keys/tempos
  - Creative "fingerprint" analysis

### 3. AI Provider Integrations
- **OpenAI Integration**
  - GPT-4 for natural language descriptions
  - Whisper for lyrics transcription
  - Custom fine-tuned models

- **Anthropic Claude**
  - Music theory analysis
  - Compositional feedback
  - Arrangement suggestions

- **Specialized Music AI**
  - Essentia.js for audio analysis
  - Spotify Web API for additional metadata
  - AcousticBrainz for open features
  - Meyda for real-time analysis

- **Local Processing**
  - TensorFlow.js models
  - Web Audio API analysis
  - WebAssembly audio processing

### 4. User-Facing Features
- **Analysis Dashboard**
  - Real-time analysis progress
  - Visual representations of features
  - Confidence scores and explanations
  - Export analysis reports

- **Batch Processing**
  - Queue management
  - Priority processing
  - Background analysis
  - Incremental updates

- **Custom Models**
  - User preference learning
  - Personal taste profiling
  - Custom genre definitions
  - Feedback loop for improvement

## Technical Stack

### Dependencies to Add (Beyond Coretet's Existing)
```json
{
  "new-dependencies": {
    "@tensorflow/tfjs": "^4.17.0",         // ML models in browser
    "meyda": "^5.6.0",                     // Audio feature extraction
    "essentia.js": "^0.1.3",               // Music analysis
    "openai": "^4.0.0",                    // GPT integration
    "@anthropic-ai/sdk": "^0.20.0",       // Claude integration
    "recharts": "^2.10.0",                 // Data visualization
    "d3": "^7.8.0",                        // Advanced viz
    "web-audio-beat-detector": "^8.0.0",  // Tempo detection
    "music-metadata-browser": "^2.5.0"    // Metadata extraction
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

### Backend Services (Supabase Edge Functions)
```typescript
// AI Provider Endpoints
- /functions/v1/analyze-track
- /functions/v1/batch-analyze
- /functions/v1/get-recommendations
- /functions/v1/generate-insights
```

## Project Structure

```
ai-analysis-explorer/
├── src/
│   ├── components/
│   │   ├── Analysis/
│   │   │   ├── TrackAnalyzer.tsx
│   │   │   ├── AnalysisResults.tsx
│   │   │   ├── ConfidenceScore.tsx
│   │   │   └── FeatureVisualizer.tsx
│   │   ├── Dashboard/
│   │   │   ├── AnalysisDashboard.tsx
│   │   │   ├── LibraryInsights.tsx
│   │   │   ├── TrendsChart.tsx
│   │   │   └── SimilarityMap.tsx
│   │   ├── Batch/
│   │   │   ├── BatchProcessor.tsx
│   │   │   ├── QueueManager.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── ResultsExport.tsx
│   │   └── Visualization/
│   │       ├── WaveformAnalysis.tsx
│   │       ├── SpectralView.tsx
│   │       ├── ChordChart.tsx
│   │       └── GenreRadar.tsx
│   ├── services/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── spotify.ts
│   │   │   └── local.ts
│   │   ├── analyzers/
│   │   │   ├── audioFeatures.ts
│   │   │   ├── structureDetection.ts
│   │   │   ├── similarityEngine.ts
│   │   │   └── metadataExtractor.ts
│   │   └── processors/
│   │       ├── audioProcessor.ts
│   │       ├── batchProcessor.ts
│   │       └── cacheManager.ts
│   ├── models/
│   │   ├── tensorflow/
│   │   │   ├── genreClassifier.ts
│   │   │   ├── moodDetector.ts
│   │   │   └── instrumentRecognizer.ts
│   │   └── custom/
│   │       ├── userPreferences.ts
│   │       └── tasteProfile.ts
│   ├── hooks/
│   │   ├── useAIAnalysis.ts
│   │   ├── useLibraryInsights.ts
│   │   ├── useSimilarity.ts
│   │   └── useBatchProcess.ts
│   ├── utils/
│   │   ├── audioUtils.ts
│   │   ├── analysisCache.ts
│   │   ├── exportFormats.ts
│   │   └── confidence.ts
│   └── types/
│       ├── analysis.ts
│       ├── features.ts
│       └── providers.ts
```

## Initial Setup Commands

```bash
# Create new Vite project
npm create vite@latest ai-analysis-explorer -- --template react-ts
cd ai-analysis-explorer

# Copy Coretet's Tailwind config for consistency
cp ../coretet_no_ai/tailwind.config.js .
cp ../coretet_no_ai/postcss.config.js .

# Install core dependencies
npm install @tensorflow/tfjs meyda openai @anthropic-ai/sdk
npm install react-query zustand recharts d3
npm install tailwindcss lucide-react
npm install music-metadata-browser web-audio-beat-detector

# Install dev dependencies
npm install -D @types/react @types/node @types/d3

# Initialize Tailwind
npx tailwindcss init -p

# Create environment file
echo "VITE_OPENAI_API_KEY=" >> .env.local
echo "VITE_ANTHROPIC_API_KEY=" >> .env.local
echo "VITE_SPOTIFY_CLIENT_ID=" >> .env.local
echo "VITE_SUPABASE_URL=" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=" >> .env.local

# Start development
npm run dev
```

## Core Implementation Examples

### Track Analyzer Component
```typescript
// src/components/Analysis/TrackAnalyzer.tsx
import { useState } from 'react';
import { analyzeAudio } from '../../services/analyzers/audioFeatures';
import { useAIProviders } from '../../hooks/useAIProviders';

export const TrackAnalyzer = ({ audioFile }: { audioFile: File }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { openai, anthropic } = useAIProviders();

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Local audio analysis
    const audioFeatures = await analyzeAudio(audioFile);
    
    // AI provider analysis
    const aiInsights = await Promise.all([
      openai.analyzeMood(audioFeatures),
      anthropic.analyzeStructure(audioFeatures)
    ]);
    
    setAnalysis({
      features: audioFeatures,
      insights: aiInsights
    });
    
    setIsAnalyzing(false);
  };

  return (
    <div className="p-6 bg-forest-main rounded-lg">
      <button onClick={runAnalysis} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
      </button>
      {analysis && <AnalysisResults data={analysis} />}
    </div>
  );
};
```

### Audio Feature Extraction
```typescript
// src/services/analyzers/audioFeatures.ts
import Meyda from 'meyda';

export const analyzeAudio = async (audioFile: File) => {
  const audioContext = new AudioContext();
  const arrayBuffer = await audioFile.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Extract features using Meyda
  const features = Meyda.extract(
    ['rms', 'spectralCentroid', 'spectralFlatness', 'mfcc'],
    audioBuffer.getChannelData(0)
  );
  
  // Additional analysis
  const tempo = await detectTempo(audioBuffer);
  const key = await detectKey(audioBuffer);
  
  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    tempo,
    key,
    spectralFeatures: features,
    energy: calculateEnergy(audioBuffer)
  };
};
```

### AI Provider Integration
```typescript
// src/services/providers/openai.ts
import OpenAI from 'openai';

export class OpenAIAnalyzer {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyzeMood(features: AudioFeatures) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'Analyze the mood and emotion of this music based on audio features.'
      }, {
        role: 'user',
        content: JSON.stringify(features)
      }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async generateDescription(analysis: AnalysisResult) {
    // Generate natural language description of the track
  }
}
```

## Development Roadmap

### Phase 1: Local Analysis (Week 1)
- [ ] Set up project structure
- [ ] Implement Web Audio API processing
- [ ] Add Meyda feature extraction
- [ ] Create basic visualization components

### Phase 2: AI Integration (Week 2)
- [ ] Integrate OpenAI API
- [ ] Add Anthropic Claude
- [ ] Implement Spotify API
- [ ] Create provider abstraction layer

### Phase 3: Library Analysis (Week 3)
- [ ] Build similarity engine
- [ ] Implement clustering algorithms
- [ ] Create insights dashboard
- [ ] Add trend analysis

### Phase 4: Production Features (Week 4)
- [ ] Implement batch processing
- [ ] Add caching layer
- [ ] Create export functionality
- [ ] Build user preference learning

## API Endpoints Design

### Track Analysis
```typescript
POST /api/analyze-track
{
  trackId: string;
  providers: ['openai', 'anthropic', 'local'];
  features: ['tempo', 'key', 'mood', 'genre'];
  priority: 'high' | 'normal' | 'low';
}
```

### Batch Processing
```typescript
POST /api/batch-analyze
{
  trackIds: string[];
  features: string[];
  callback: string; // Webhook URL
}
```

### Library Insights
```typescript
GET /api/library-insights
{
  userId: string;
  timeRange: 'week' | 'month' | 'year' | 'all';
  metrics: ['genre', 'tempo', 'mood', 'productivity'];
}
```

## Integration with Coretet

### Database Schema Extensions
```sql
-- New tables for AI analysis
CREATE TABLE track_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  provider TEXT, -- 'openai', 'anthropic', 'local'
  analysis_type TEXT, -- 'tempo', 'key', 'mood', 'structure'
  results JSONB,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_ai_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  enabled BOOLEAN DEFAULT false,
  providers TEXT[] DEFAULT '{}',
  auto_analyze BOOLEAN DEFAULT false,
  share_insights BOOLEAN DEFAULT false
);

-- Add to existing tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS 
  ai_analysis JSONB,
  analysis_status TEXT DEFAULT 'pending';
```

### Integration Approach

1. **Opt-in UI Component**
   ```typescript
   // Add to existing Settings page
   <AIAnalysisSettings 
     onEnable={handleEnableAI}
     providers={['openai', 'anthropic', 'local']}
   />
   ```

2. **Track Menu Addition**
   ```typescript
   // Add to existing track actions
   {aiEnabled && (
     <button onClick={() => analyzeTrack(track.id)}>
       <Brain className="w-4 h-4" />
       Analyze with AI
     </button>
   )}
   ```

3. **LibraryContext Extension**
   ```typescript
   interface LibraryContextValue {
     // Existing
     tracks: Track[];
     // New additions
     analyzeTrack: (trackId: string) => Promise<void>;
     getTrackAnalysis: (trackId: string) => Analysis | null;
     libraryInsights: LibraryInsights | null;
   }
   ```

4. **Supabase Edge Functions**
   ```typescript
   // New edge functions to create
   supabase/functions/
     analyze-track/
     batch-analyze/
     get-insights/
   ```

### User Experience Considerations

Given Coretet's philosophy of manual control:

1. **Clear Value Proposition**
   - Present as "AI Assistant" not "AI Automation"
   - Suggestions, not automatic changes
   - Always show confidence scores

2. **Transparent Operations**
   - Show what data is being analyzed
   - Explain what each provider does
   - Allow granular control

3. **Cost Transparency**
   - Show credits/costs upfront
   - Free tier with local-only analysis
   - Clear upgrade path

### Privacy & Consent
- Explicit opt-in required
- Data never leaves Supabase without consent
- Local processing option always available
- Clear data retention policies

## Key Challenges

1. **Accuracy**
   - Confidence scoring
   - Multiple provider consensus
   - User feedback integration
   - Ground truth validation

2. **Scalability**
   - Large library processing
   - API rate limits
   - Storage optimization
   - Real-time vs batch trade-offs

3. **User Experience**
   - Clear value proposition
   - Intuitive visualizations
   - Actionable insights
   - Non-technical explanations

## Success Metrics

- Analysis accuracy > 85% (user validated)
- Processing time < 30s per track
- Library insights generation < 5s
- User engagement with AI features > 60%
- Cost per analysis < $0.01

## Resources & References

- [TensorFlow.js Music Models](https://magenta.tensorflow.org/js)
- [Meyda Audio Features](https://meyda.js.org/)
- [Essentia.js Documentation](https://mtg.github.io/essentia.js/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Music Information Retrieval](https://musicinformationretrieval.com/)

## Testing Strategy

- Unit tests for analysis functions
- Mock API responses for provider testing
- Accuracy benchmarking against known tracks
- Load testing for batch processing
- A/B testing for feature adoption