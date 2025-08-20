import React, { useState, useRef } from 'react';
import { X, Upload, Music, FileAudio, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useProjects } from '../../contexts/ProjectContext';

interface WorkVersionUploadProps {
  workId: string;
  versionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * WorkVersionUpload - Upload audio files for a work version
 */
export default function WorkVersionUpload({ 
  workId, 
  versionId, 
  onClose, 
  onSuccess 
}: WorkVersionUploadProps) {
  const { user } = useAuth();
  const { createVersion, createIteration } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createNewVersion, setCreateNewVersion] = useState(!versionId);
  const [versionName, setVersionName] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const audioFiles = selectedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.match(/\.(mp3|wav|m4a|flac|ogg|aac)$/i)
    );

    if (audioFiles.length !== selectedFiles.length) {
      setError('Some files were not audio files and were skipped');
    }

    setFiles(audioFiles);
    setError(null);
  };

  const handleUpload = async () => {
    if (!files.length || !user) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let targetVersionId = versionId;

      // Create new version if needed
      if (createNewVersion || !versionId) {
        const newVersion = await createVersion({
          project_id: workId,
          name: versionName || 'New Version',
          version_number: '1.0.0', // This should be calculated based on existing versions
          is_primary: false
        });
        targetVersionId = newVersion.id;
      }

      if (!targetVersionId) {
        throw new Error('No version ID available');
      }

      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const file of files) {
        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${workId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio-files')
          .getPublicUrl(fileName);

        // Create iteration record
        await createIteration({
          version_id: targetVersionId,
          iteration_name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          iteration_number: uploadedCount + 1,
          file_url: publicUrl,
          duration: 0, // Would need audio analysis to get actual duration
          file_size: file.size,
          notes: `Uploaded: ${new Date().toLocaleDateString()}`
        });

        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      // Success
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload files. Please try again.');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const audioFiles = droppedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.match(/\.(mp3|wav|m4a|flac|ogg|aac)$/i)
    );
    setFiles(audioFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-forest-main border border-forest-light rounded-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-forest-light">
          <h2 className="font-anton text-2xl text-silver">Upload Audio</h2>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Version Selection */}
          {!versionId && (
            <div className="mb-6 p-4 bg-forest-dark rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-accent-yellow mt-0.5" />
                <div className="flex-1">
                  <p className="font-quicksand text-sm text-silver mb-3">
                    No version selected. Create a new version or select an existing one.
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={createNewVersion}
                        onChange={(e) => setCreateNewVersion(e.target.checked)}
                        className="rounded border-forest-light text-accent-yellow focus:ring-accent-yellow"
                      />
                      <span className="font-quicksand text-sm text-silver">Create new version</span>
                    </label>
                    {createNewVersion && (
                      <input
                        type="text"
                        value={versionName}
                        onChange={(e) => setVersionName(e.target.value)}
                        placeholder="Version name (e.g., Demo, Acoustic, Final)"
                        className="w-full px-3 py-2 bg-forest-main border border-forest-light rounded-lg font-quicksand text-sm text-silver placeholder:text-silver/40 focus:outline-none focus:border-accent-yellow"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-forest-light hover:border-accent-coral rounded-xl p-12 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {files.length === 0 ? (
              <>
                <Upload className="w-12 h-12 text-silver/40 mx-auto mb-4" />
                <p className="font-quicksand text-silver mb-2">
                  Drop audio files here or click to browse
                </p>
                <p className="font-quicksand text-sm text-silver/40">
                  Supports MP3, WAV, M4A, FLAC, OGG, AAC
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <FileAudio className="w-12 h-12 text-accent-coral mx-auto mb-4" />
                <p className="font-quicksand text-silver mb-4">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-forest-dark rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-3">
                        <Music className="w-4 h-4 text-silver/60" />
                        <span className="font-quicksand text-sm text-silver truncate max-w-sm">
                          {file.name}
                        </span>
                      </div>
                      <span className="font-quicksand text-xs text-silver/40">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="font-quicksand text-sm text-accent-coral hover:text-accent-coral/80 transition-colors"
                >
                  Add more files
                </button>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-quicksand text-sm text-silver">Uploading...</span>
                <span className="font-quicksand text-sm text-silver">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 bg-forest-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-coral transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="font-quicksand text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end mt-6 space-x-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 font-quicksand text-silver/60 hover:text-silver transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!files.length || isUploading || (createNewVersion && !versionName)}
              className="px-6 py-2 bg-accent-coral text-white font-quicksand font-semibold rounded-lg hover:bg-accent-coral/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}