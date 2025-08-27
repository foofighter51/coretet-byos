import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileAudio, AlertCircle, CheckCircle, Tag, Plus, X } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { useLibrary } from '../../contexts/LibraryContext';
import { supabase, type Database } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PREDEFINED_TAGS, getTagColor } from '../../utils/tags';
import { GENRE_OPTIONS, KEY_OPTIONS } from '../../constants/musicData';

interface FileUploadProps {
  onUploadStart?: () => void;
  onUploadComplete?: (track: Track) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadStart, onUploadComplete }) => {
  const { user, refreshProfile } = useAuth();
  const { addTrack, updateTrack, getAllUsedTags } = useLibrary();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [completedFiles, setCompletedFiles] = useState<Set<string>>(new Set());
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  
  // Clear state when component unmounts
  useEffect(() => {
    return () => {
      setSelectedFiles([]);
      setUploadingFiles(new Set());
      setCompletedFiles(new Set());
      setRejectedFiles([]);
    };
  }, []);
  
  // Batch metadata state
  const [batchMetadata, setBatchMetadata] = useState({
    artist: '',
    collection: '',
    category: 'songs' as TrackCategory,
    genres: [] as string[],
    key: '',
    tags: [] as string[],
  });
  
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  
  // Get all available tags
  const usedTags = getAllUsedTags().map(({ tag }) => tag);
  const allTags = [...new Set([...PREDEFINED_TAGS, ...usedTags])];
  
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !batchMetadata.tags.includes(tag)
  );
  
  const isNewTag = tagSearchQuery.trim() && 
    !allTags.some(tag => tag.toLowerCase() === tagSearchQuery.toLowerCase()) &&
    tagSearchQuery.length > 1;
  
  const addTag = (tag: string) => {
    if (!batchMetadata.tags.includes(tag)) {
      setBatchMetadata(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagSearchQuery('');
    }
  };
  
  const removeTag = (tag: string) => {
    setBatchMetadata(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(t => t !== tag) 
    }));
  };
  
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  
  const addGenre = (genre: string) => {
    if (!batchMetadata.genres.includes(genre)) {
      setBatchMetadata(prev => ({ ...prev, genres: [...prev.genres, genre] }));
    }
  };
  
  const removeGenre = (genre: string) => {
    setBatchMetadata(prev => ({ 
      ...prev, 
      genres: prev.genres.filter(g => g !== genre) 
    }));
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // Handle rejected files
    if (fileRejections.length > 0) {
      setRejectedFiles(fileRejections);
      // Clear rejected files after 5 seconds
      setTimeout(() => {
        setRejectedFiles([]);
      }, 5000);
    }

    // Add accepted files to selected files list
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);
  
  const uploadFiles = async () => {
    if (!user || selectedFiles.length === 0) return;
    
    // Clear previous completed files when starting new upload
    setCompletedFiles(new Set());
    onUploadStart?.();

    for (const file of selectedFiles) {
      try {
        setUploadingFiles(prev => new Set([...prev, file.name]));
        
        // Generate unique filename with sanitized name
        const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
        const trackId = crypto.randomUUID();
        // Sanitize filename: remove special characters, keep only alphanumeric, dash, underscore
        const sanitizedName = file.name
          .substring(0, file.name.lastIndexOf('.'))
          .replace(/[^a-zA-Z0-9\-_\s]/g, '_') // Allow spaces temporarily
          .replace(/\s+/g, '_') // Then replace spaces with underscores
          .replace(/_+/g, '_') // Replace multiple underscores with single
          .replace(/^_|_$/g, '') // Remove leading/trailing underscores
          .substring(0, 100); // Limit length
        let fileName = `${user.id}/${trackId}/${sanitizedName}${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          // If it's an invalid key error, try with even more sanitization
          if (uploadError.message?.includes('Invalid key')) {
            const ultraSafeName = sanitizedName.replace(/[^a-zA-Z0-9]/g, '');
            const safeFileName = `${user.id}/${trackId}/${ultraSafeName || 'track'}${fileExtension}`;
            
            console.log('Retrying with safer filename:', safeFileName);
            
            const { data: retryData, error: retryError } = await supabase.storage
              .from('audio-files')
              .upload(safeFileName, file, {
                cacheControl: '3600',
                upsert: false
              });
            
            if (retryError) throw retryError;
            // Update fileName for subsequent operations
            fileName = safeFileName;
          } else {
            throw uploadError;
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio-files')
          .getPublicUrl(fileName);

        // Create track record in database with batch metadata
        // Using 'any' to bypass TypeScript cache issues with removed 'analysis' column
        const trackData: any = {
          id: trackId,
          user_id: user.id,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          file_name: file.name,
          file_size: file.size,
          storage_path: fileName,
          category: batchMetadata.category || 'songs',
          tags: batchMetadata.tags || [],
        };
        
        // Add optional fields if provided
        if (batchMetadata.artist) {
          trackData.artist = batchMetadata.artist;
        }
        if (batchMetadata.collection) {
          trackData.collection = batchMetadata.collection;
        }
        if (batchMetadata.genres.length > 0) {
          trackData.genre = batchMetadata.genres.join(', ');
        }
        if (batchMetadata.key) {
          trackData.key = batchMetadata.key;
        }
        
        const { data: track, error: trackError } = await supabase
          .from('tracks')
          .insert(trackData)
          .select()
          .single();

        if (trackError) throw trackError;

        // Create track object for local state
        const localTrack: Track = {
          id: track.id,
          name: track.name,
          file,
          url: publicUrl,
          duration: 0,
          category: track.category as TrackCategory,
          uploadedAt: new Date(track.created_at),
          tags: track.tags || [],
          artist: track.artist,
          collection: track.collection,
          genre: track.genre,
        };

        // Add track to library
        addTrack(localTrack);

        // Get audio duration
        const audio = new Audio(URL.createObjectURL(file));
        audio.onloadedmetadata = async () => {
          const duration = audio.duration;
          
          // Update duration in database
          await supabase
            .from('tracks')
            .update({ duration })
            .eq('id', trackId);
          
          // Update local state
          updateTrack(trackId, { duration });
        };

        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.name);
          return newSet;
        });

        setCompletedFiles(prev => new Set([...prev, file.name]));

        onUploadComplete?.(localTrack);
        
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.name);
          return newSet;
        });
      }
    }

    
    // Clear selected files after successful upload
    setSelectedFiles([]);
    // Refresh profile to update storage usage
    await refreshProfile();
    // Don't automatically clear completed files - let user see what was uploaded
  };
  
  const removeSelectedFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.m4a', '.wav', '.flac']
    },
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const hasSelected = selectedFiles.length > 0;
  const hasUploading = uploadingFiles.size > 0;
  const hasCompleted = completedFiles.size > 0;

  return (
    <div className="space-y-6">
      {/* Batch Metadata Form */}
      <div className="bg-forest-light/50 rounded-xl p-6 space-y-4">
        <div className="mb-4">
          <h3 className="font-quicksand text-lg text-silver">Track Information (Optional)</h3>
          <p className="font-quicksand text-xs text-silver/60 mt-1">
            Add metadata before uploading. This information will be applied to all tracks in the batch.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Artist */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">Artist</label>
            <input
              type="text"
              value={batchMetadata.artist}
              onChange={(e) => setBatchMetadata(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder="Artist name"
            />
          </div>
          
          {/* Album */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">Album</label>
            <input
              type="text"
              value={batchMetadata.collection}
              onChange={(e) => setBatchMetadata(prev => ({ ...prev, collection: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              placeholder="Album"
            />
          </div>
          
          {/* Type */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">Type</label>
            <select
              value={batchMetadata.category}
              onChange={(e) => setBatchMetadata(prev => ({ ...prev, category: e.target.value as TrackCategory }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="songs">Songs</option>
              <option value="final-versions">Final Versions</option>
              <option value="live-performances">Live Performances</option>
              <option value="demos">Recordings</option>
              <option value="ideas">Ideas</option>
              <option value="voice-memos">Voice Memos</option>
            </select>
          </div>
          
          {/* Genre - Multi-select */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">Genres</label>
            <div className="relative">
              {/* Selected Genres */}
              {batchMetadata.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {batchMetadata.genres.map(genre => (
                    <span
                      key={genre}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-accent-yellow/20 rounded-full text-xs font-medium text-silver"
                    >
                      <span>{genre}</span>
                      <button
                        onClick={() => removeGenre(genre)}
                        className="hover:text-accent-coral"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Genre Dropdown */}
              <div
                className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver cursor-pointer hover:border-accent-yellow focus:outline-none focus:border-accent-yellow"
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
              >
                {batchMetadata.genres.length === 0 ? 'Select genres...' : `${batchMetadata.genres.length} selected`}
              </div>
              
              {showGenreDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-forest-light border border-forest-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {GENRE_OPTIONS.map(genre => (
                    <div
                      key={genre}
                      className="px-3 py-2 hover:bg-forest-main cursor-pointer font-quicksand text-sm text-silver"
                      onClick={() => {
                        addGenre(genre);
                        setShowGenreDropdown(false);
                      }}
                    >
                      {genre}
                      {batchMetadata.genres.includes(genre) && (
                        <span className="ml-2 text-accent-yellow">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Key */}
          <div>
            <label className="block font-quicksand text-sm text-silver/80 mb-2">Key</label>
            <select
              value={batchMetadata.key}
              onChange={(e) => setBatchMetadata(prev => ({ ...prev, key: e.target.value }))}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
            >
              <option value="">Select key...</option>
              {KEY_OPTIONS.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Tags */}
        <div>
          <label className="block font-quicksand text-sm text-silver/80 mb-2 flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Tags</span>
          </label>
          
          {/* Selected Tags */}
          {batchMetadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {batchMetadata.tags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-silver ${getTagColor(tag)}`}
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Tag Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search or create tags..."
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              onFocus={() => setShowTagDropdown(true)}
              className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            />
            
            {/* Tag Dropdown */}
            {showTagDropdown && (tagSearchQuery || filteredTags.length > 0) && (
              <div className="absolute top-full mt-1 w-full bg-forest-main border border-forest-light rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {/* Create new tag */}
                {isNewTag && (
                  <button
                    onClick={() => {
                      addTag(tagSearchQuery);
                      setShowTagDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-accent-yellow/20 text-left transition-colors border-b border-forest-light"
                  >
                    <Plus className="w-3 h-3 text-accent-yellow" />
                    <span className="font-quicksand text-sm text-accent-yellow">
                      Create "{tagSearchQuery}"
                    </span>
                  </button>
                )}
                
                {/* Existing tags */}
                {filteredTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      addTag(tag);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-forest-light text-left transition-colors"
                  >
                    <Plus className="w-3 h-3 text-silver/60" />
                    <span className="font-quicksand text-sm text-silver">{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Click outside to close dropdown */}
          {showTagDropdown && (
            <div 
              className="fixed inset-0 z-0" 
              onClick={() => setShowTagDropdown(false)}
            />
          )}
        </div>
      </div>
      
      {/* Selected Files */}
      {hasSelected && !hasUploading && !hasCompleted && (
        <div className="bg-forest-light/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-quicksand text-lg text-silver">Selected Files ({selectedFiles.length})</h3>
            <button
              onClick={uploadFiles}
              className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
            >
              Upload All
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-3 bg-forest-light rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileAudio className="w-5 h-5 text-silver/60" />
                  <div>
                    <p className="font-quicksand text-sm text-silver">{file.name.replace(/\.[^/.]+$/, '')}</p>
                    <p className="font-quicksand text-xs text-silver/60">
                      {file.name.split('.').pop()?.toUpperCase()} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeSelectedFile(file.name)}
                  className="text-silver/60 hover:text-accent-coral transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-forest-light">
            <button
              onClick={() => setSelectedFiles([])}
              className="px-3 py-1.5 text-silver/60 hover:text-silver font-quicksand text-sm transition-colors"
            >
              Clear All
            </button>
            <span className="font-quicksand text-xs text-silver/60">
              Total size: {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      )}
      
      {/* Upload Area - Show only when no files are selected or all uploads are complete */}
      {(!hasSelected || hasCompleted) && (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
            isDragActive
              ? 'border-accent-yellow bg-accent-yellow/10 scale-[1.02]'
              : 'border-forest-light hover:border-accent-yellow hover:bg-forest-light/10'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isDragActive ? 'bg-accent-yellow text-forest-dark' : 'bg-forest-light text-accent-yellow'
            }`}>
              <Upload className="w-8 h-8" />
            </div>
            
            <div>
              <p className="font-quicksand text-lg text-silver mb-2">
                {isDragActive ? 'Drop your audio files here' : 'Drop audio files or click to browse'}
              </p>
              <p className="font-quicksand text-sm text-silver/80">
                Supports MP3, M4A, WAV, and FLAC files up to 100MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {(hasUploading || hasCompleted) && (
        <div className="bg-forest-light rounded-lg p-4 space-y-3">
          {hasUploading && (
            <div className="flex items-center space-x-3">
              <FileAudio className="w-5 h-5 text-accent-yellow animate-pulse" />
              <span className="font-quicksand text-sm text-silver">
                Uploading {uploadingFiles.size} file{uploadingFiles.size !== 1 ? 's' : ''}...
              </span>
            </div>
          )}
          
          {hasCompleted && !hasUploading && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-quicksand text-sm text-silver">
                  Successfully uploaded {completedFiles.size} file{completedFiles.size !== 1 ? 's' : ''}!
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-quicksand text-xs text-silver/60">
                  You can close this dialog or upload more files.
                </span>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setCompletedFiles(new Set());
                    setBatchMetadata({
                      artist: '',
                      collection: '',
                      category: 'songs' as TrackCategory,
                      genre: '',
                      tags: [],
                    });
                  }}
                  className="px-3 py-1 bg-accent-yellow text-forest-dark rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors"
                >
                  Upload More
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {rejectedFiles.length > 0 && (
        <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-accent-coral" />
            <span className="font-quicksand text-sm text-accent-coral font-medium">
              Some files were rejected:
            </span>
          </div>
          <ul className="space-y-1">
            {rejectedFiles.map((rejection, index) => (
              <li key={index} className="font-quicksand text-xs text-accent-coral/80">
                {rejection.file.name}: {rejection.errors[0]?.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;