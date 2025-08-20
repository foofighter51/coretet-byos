import React, { useState, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { Track, TrackCategory } from '../../types';

interface FileUploadProps {
  onUploadComplete?: (track: Track) => void;
  onClose?: () => void;
}

const FileUploadFixed: React.FC<FileUploadProps> = ({ onUploadComplete, onClose }) => {
  const { user, refreshProfile } = useAuth();
  const { addTrack, updateTrack } = useLibrary();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [completedFiles, setCompletedFiles] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBatchMetadata, setShowBatchMetadata] = useState(false);
  const [batchMetadata, setBatchMetadata] = useState({
    artist: '',
    collection: '',
    genre: '',
    category: 'songs' as TrackCategory,
    tags: [] as string[]
  });

  useEffect(() => {
    if (selectedFiles.length > 0 && !showBatchMetadata) {
      setShowBatchMetadata(true);
    }
  }, [selectedFiles.length, showBatchMetadata]);

  const onDrop = (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.errors[0]?.code === 'file-too-large') {
          return `${file.file.name}: File too large (max 100MB)`;
        }
        return `${file.file.name}: Invalid file type`;
      }).join(', ');
      setErrorMessage(errors);
      return;
    }

    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    setErrorMessage(null);
  };

  const uploadFiles = async () => {
    if (!user) {
      setErrorMessage('You must be logged in to upload files');
      return;
    }

    setErrorMessage(null);

    for (const file of selectedFiles) {
      if (uploadingFiles.has(file.name) || completedFiles.has(file.name)) {
        continue;
      }

      setUploadingFiles(prev => new Set([...prev, file.name]));

      try {
        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${user.id}/${timestamp}_${randomString}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('audio-files')
          .getPublicUrl(fileName);

        // Use RPC function to create track record, bypassing REST API cache
        const { data: trackResult, error: trackError } = await supabase
          .rpc('upload_track', {
            p_user_id: user.id,
            p_name: file.name.replace(/\.[^/.]+$/, ''),
            p_file_name: file.name,
            p_file_size: file.size,
            p_storage_path: fileName,
            p_category: batchMetadata.category || 'songs',
            p_tags: batchMetadata.tags || [],
            p_artist: batchMetadata.artist || null,
            p_collection: batchMetadata.collection || null,
            p_genre: batchMetadata.genre || null,
            p_tempo: null,
            p_key: null
          });

        if (trackError) throw trackError;

        // Create track object for local state
        const localTrack: Track = {
          id: trackResult[0].id,
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          url: urlData?.publicUrl || '',
          duration: 0,
          category: batchMetadata.category as TrackCategory,
          uploadedAt: new Date(trackResult[0].created_at),
          tags: batchMetadata.tags || [],
          artist: batchMetadata.artist,
          collection: batchMetadata.collection,
          genre: batchMetadata.genre,
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
            .eq('id', trackResult[0].id);
          
          // Update local state
          updateTrack(trackResult[0].id, { duration });
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
        setErrorMessage(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.name);
          return newSet;
        });
      }
    }

    setSelectedFiles([]);
    await refreshProfile();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-forest-main rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-anton text-2xl text-silver">Upload Music</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-silver/60 hover:text-silver transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Batch Metadata Form */}
        {showBatchMetadata && selectedFiles.length > 0 && (
          <div className="bg-forest-light/50 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Artist */}
              <div>
                <label className="block font-quicksand text-xs text-silver/80 mb-1">Artist</label>
                <input
                  type="text"
                  value={batchMetadata.artist}
                  onChange={(e) => setBatchMetadata(prev => ({ ...prev, artist: e.target.value }))}
                  className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  placeholder="Artist name"
                />
              </div>
              
              {/* Collection */}
              <div>
                <label className="block font-quicksand text-xs text-silver/80 mb-1">Album/Collection</label>
                <input
                  type="text"
                  value={batchMetadata.collection}
                  onChange={(e) => setBatchMetadata(prev => ({ ...prev, collection: e.target.value }))}
                  className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  placeholder="Album"
                />
              </div>
              
              {/* Category */}
              <div>
                <label className="block font-quicksand text-xs text-silver/80 mb-1">Type</label>
                <select
                  value={batchMetadata.category}
                  onChange={(e) => setBatchMetadata(prev => ({ ...prev, category: e.target.value as TrackCategory }))}
                  className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                >
                  <option value="songs">Songs</option>
                  <option value="final-versions">Final Versions</option>
                  <option value="live-performances">Live Performances</option>
                  <option value="demos">Demos</option>
                  <option value="ideas">Ideas</option>
                  <option value="voice-memos">Voice Memos</option>
                </select>
              </div>
              
              {/* Genre */}
              <div>
                <label className="block font-quicksand text-xs text-silver/80 mb-1">Genre</label>
                <input
                  type="text"
                  value={batchMetadata.genre}
                  onChange={(e) => setBatchMetadata(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  placeholder="Genre"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-accent-yellow bg-accent-yellow/5'
              : 'border-silver/30 hover:border-silver/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-silver/60 mx-auto mb-4" />
          {isDragActive ? (
            <p className="font-quicksand text-silver">Drop the files here...</p>
          ) : (
            <>
              <p className="font-quicksand text-silver mb-2">
                Drag & drop audio files here, or click to select
              </p>
              <p className="font-quicksand text-sm text-silver/60">
                Supports MP3, M4A, WAV, FLAC (max 100MB per file)
              </p>
            </>
          )}
        </div>

        {/* Selected Files */}
        {hasSelected && (
          <div className="mt-6">
            <h3 className="font-quicksand font-semibold text-silver mb-3">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map(file => (
                <div
                  key={file.name}
                  className="flex items-center justify-between bg-forest-light/30 rounded-lg px-3 py-2"
                >
                  <span className="font-quicksand text-sm text-silver truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeSelectedFile(file.name)}
                    className="text-silver/60 hover:text-accent-coral transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploading Files */}
        {hasUploading && (
          <div className="mt-6">
            <h3 className="font-quicksand font-semibold text-silver mb-3">
              Uploading...
            </h3>
            <div className="space-y-2">
              {Array.from(uploadingFiles).map(fileName => (
                <div
                  key={fileName}
                  className="flex items-center space-x-2 text-silver/80"
                >
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="font-quicksand text-sm">{fileName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Files */}
        {hasCompleted && (
          <div className="mt-6">
            <h3 className="font-quicksand font-semibold text-green-400 mb-3">
              Completed ({completedFiles.size})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Array.from(completedFiles).map(fileName => (
                <div
                  key={fileName}
                  className="flex items-center space-x-2 text-green-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-quicksand text-sm">{fileName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
            >
              Close
            </button>
          )}
          <button
            onClick={uploadFiles}
            disabled={!hasSelected || hasUploading}
            className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadFixed;