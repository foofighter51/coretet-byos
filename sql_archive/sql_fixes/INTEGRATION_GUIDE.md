# Audio Analysis Integration Guide

This guide explains how to integrate the Essentia.js-based audio analysis into your application to automatically extract tempo and key metadata when tracks are uploaded.

## Overview

The integration provides:
- **Tempo detection** (BPM) with confidence score
- **Key detection** (note + scale) with confidence score
- Standalone module that can be integrated into any web application

## Prerequisites

1. **Essentia.js library files**:
   - `essentia-wasm.web.js`
   - `essentia.js-core.js`
   - `essentia-wasm.web.wasm`

2. **Web Audio API support** (all modern browsers)

## Integration Steps

### Step 1: Include Essentia.js Scripts

Add these scripts to your HTML before your app's JavaScript:

```html
<script src="https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.web.js"></script>
<script src="https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-core.js"></script>
```

Or download and host them locally:
```html
<script src="/path/to/essentia-wasm.web.js"></script>
<script src="/path/to/essentia.js-core.js"></script>
```

### Step 2: Copy the Analysis Module

Copy `audioAnalysisModule.js` to your project. This module provides:
- Automatic initialization
- Simple API: `analyzeFile(audioFile)`
- Error handling and fallbacks
- Proper cleanup of resources

### Step 3: Basic Integration

```javascript
import { AudioAnalysisModule } from './audioAnalysisModule.js';

// Create analyzer instance
const analyzer = new AudioAnalysisModule();

// When a file is uploaded
async function onFileUpload(file) {
    try {
        // Analyze the audio
        const { tempo, key, confidence } = await analyzer.analyzeFile(file);
        
        // Update your metadata fields
        document.getElementById('tempo-field').value = tempo;
        document.getElementById('key-field').value = key;
        
        // Save to your backend
        await saveMetadata({
            fileId: file.id,
            tempo: tempo,
            key: key,
            tempoConfidence: confidence.tempo,
            keyConfidence: confidence.key
        });
    } catch (error) {
        console.error('Analysis failed:', error);
        // Handle error - maybe allow manual entry
    }
}
```

### Step 4: Advanced Integration Options

#### Option A: Integrate with existing upload flow

```javascript
// Modify your existing upload handler
async function uploadTrack(file, metadata) {
    // Run analysis in parallel with upload
    const [analysisResult, uploadResult] = await Promise.all([
        analyzer.analyzeFile(file),
        uploadToServer(file)
    ]);
    
    // Merge analysis with other metadata
    const completeMetadata = {
        ...metadata,
        tempo: analysisResult.tempo,
        key: analysisResult.key,
        analyzedAt: new Date()
    };
    
    // Save complete metadata
    await saveTrackMetadata(uploadResult.id, completeMetadata);
}
```

#### Option B: Progressive enhancement

```javascript
// Add analysis without breaking existing flow
function enhanceUploadForm() {
    const form = document.getElementById('upload-form');
    const tempoInput = document.getElementById('tempo');
    const keyInput = document.getElementById('key');
    
    form.addEventListener('change', async (e) => {
        if (e.target.type === 'file') {
            const file = e.target.files[0];
            if (!file) return;
            
            // Show analyzing indicator
            tempoInput.placeholder = 'Analyzing...';
            keyInput.placeholder = 'Analyzing...';
            
            try {
                const result = await analyzer.analyzeFile(file);
                tempoInput.value = result.tempo;
                keyInput.value = result.key;
            } catch (error) {
                // Restore original placeholders on error
                tempoInput.placeholder = 'Enter tempo';
                keyInput.placeholder = 'Enter key';
            }
        }
    });
}
```

## Performance Considerations

1. **Initialize once**: Create one analyzer instance and reuse it
2. **File size**: Analysis time scales with file duration
3. **Memory usage**: Large files will use more memory during analysis
4. **Browser limitations**: Some browsers limit Web Audio API buffer sizes

## Troubleshooting

### Common Issues

1. **"Essentia.js scripts not loaded"**
   - Ensure scripts are loaded before initializing the analyzer
   - Check network tab for 404 errors

2. **"Failed to decode audio data"**
   - Verify file is a valid audio format (MP3, WAV, M4A, etc.)
   - Check browser audio codec support

3. **Incorrect results**
   - The analyzer works best with music that has clear rhythm/harmony
   - Electronic/ambient music may have less reliable key detection
   - Very short clips (<10 seconds) may have lower accuracy

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may need user interaction for audio context)
- Mobile browsers: May have memory limitations with large files

## API Reference

### AudioAnalysisModule

#### `new AudioAnalysisModule()`
Creates a new analyzer instance.

#### `async initialize()`
Initializes Essentia.js and Web Audio API. Called automatically on first use.

#### `async analyzeFile(audioInput)`
Analyzes an audio file.

**Parameters:**
- `audioInput`: File, Blob, or ArrayBuffer

**Returns:**
```javascript
{
    tempo: number,        // BPM rounded to nearest integer
    key: string,         // Format: "C major", "F# minor", etc.
    confidence: {
        tempo: number,   // 0-1, higher is more confident
        key: number      // 0-1, higher is more confident
    }
}
```

## Example Projects

See `integration-example.js` for complete examples including:
- Basic file upload with analysis
- Form integration
- Batch processing
- React component example
- Progress indicators

## License

This integration uses Essentia.js, which is released under the GNU Affero General Public License v3.0.