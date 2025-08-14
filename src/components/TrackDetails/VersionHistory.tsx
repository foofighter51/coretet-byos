import React, { useState, useEffect } from 'react';
import { Clock, GitBranch, Download, Trash2, Star, ChevronRight, Play, Pause } from 'lucide-react';
import { Track } from '../../types';
import { useTrackVariations } from '../../hooks/useTrackVariations';
import { useAudio } from '../../contexts/AudioContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { formatDuration, formatRelativeDate } from '../../utils/trackUtils';

interface VersionHistoryProps {
  track: Track;
  onClose?: () => void;
}

interface Version {
  track: Track;
  versionNumber: number;
  versionName: string;
  isPrimary: boolean;
  createdAt: string;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ track }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const { getVariations, changePrimaryTrack, unlinkVariation } = useTrackVariations();
  const { currentTrack, isPlaying, play, pause } = useAudio();

  useEffect(() => {
    loadVersions();
  }, [track.id]);

  const loadVersions = async () => {
    const variations = await getVariations(track.id);
    
    // Sort by upload date and assign version numbers
    const sortedVersions = variations
      .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
      .map((t, index) => ({
        track: t,
        versionNumber: index + 1,
        versionName: t.name || `Version ${index + 1}`,
        isPrimary: !t.primary_track_id,
        createdAt: t.uploadedAt ? t.uploadedAt.toString() : new Date().toISOString()
      }));
    
    setVersions(sortedVersions);
  };

  const handleCreateVersion = async () => {
    if (!track.url || !newVersionName.trim()) return;
    
    setIsCreatingVersion(true);
    try {
      // For now, we'll show a message about future functionality
      alert('Version creation will be available once file duplication is implemented.');
      // In a full implementation, this would:
      // 1. Duplicate the current track's audio file
      // 2. Create a new track entry linked as a variation
      // 3. Preserve metadata with the new version name
      setNewVersionName('');
    } catch (error) {
      // Error creating version
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleSetPrimary = async (versionId: string) => {
    const currentPrimary = versions.find(v => v.isPrimary);
    if (currentPrimary) {
      await changePrimaryTrack(currentPrimary.track.id, versionId);
      await loadVersions();
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (versions.length <= 1) {
      alert('Cannot delete the only version');
      return;
    }
    
    const confirmed = window.confirm('Are you sure you want to delete this version?');
    if (confirmed) {
      await unlinkVariation(versionId);
      await loadVersions();
    }
  };

  const handlePlayVersion = (version: Version) => {
    if (!version.track.url) return;
    
    if (currentTrack === version.track.id && isPlaying) {
      pause();
    } else {
      play(version.track.id, version.track.url);
    }
  };

  const getVersionDifferences = (v1: Version, v2: Version) => {
    const differences: string[] = [];
    
    if (v1.track.tempo !== v2.track.tempo) {
      differences.push(`Tempo: ${v1.track.tempo || 'N/A'} → ${v2.track.tempo || 'N/A'} BPM`);
    }
    if (v1.track.key !== v2.track.key) {
      differences.push(`Key: ${v1.track.key || 'N/A'} → ${v2.track.key || 'N/A'}`);
    }
    if (v1.track.duration !== v2.track.duration) {
      differences.push(`Duration: ${formatDuration(v1.track.duration)} → ${formatDuration(v2.track.duration)}`);
    }
    
    return differences;
  };

  return (
    <div className="space-y-4">
      {/* Create New Version */}
      <div className="bg-forest-light/30 rounded-lg p-4">
        <h4 className="font-quicksand font-semibold text-sm text-silver mb-3">Create New Version</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="Version name (e.g., 'Final Mix', 'Radio Edit')"
            className="flex-1 bg-forest-light border border-forest-light rounded px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
          />
          <button
            onClick={handleCreateVersion}
            disabled={!newVersionName.trim() || isCreatingVersion}
            className="px-4 py-2 bg-accent-yellow text-forest-dark rounded font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingVersion ? 'Creating...' : 'Create Version'}
          </button>
        </div>
        <p className="text-xs text-silver/60 mt-2">
          Save the current state as a new version to track changes over time
        </p>
      </div>

      {/* Version Timeline */}
      <div className="space-y-3">
        <h4 className="font-quicksand font-semibold text-sm text-silver flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Version History ({versions.length})
        </h4>
        
        <div className="space-y-2">
          {versions.map((version, index) => {
            const isCurrentTrack = version.track.id === track.id;
            const isPlayingThis = currentTrack === version.track.id && isPlaying;
            const previousVersion = index > 0 ? versions[index - 1] : null;
            const differences = previousVersion ? getVersionDifferences(previousVersion, version) : [];
            
            return (
              <div key={version.track.id} className="relative">
                {/* Timeline connector */}
                {index < versions.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-forest-light" />
                )}
                
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                    isCurrentTrack 
                      ? 'bg-accent-yellow/10 border border-accent-yellow' 
                      : 'bg-forest-light/20 hover:bg-forest-light/30 border border-transparent'
                  }`}
                  onClick={() => setSelectedVersion(
                    selectedVersion === version.track.id ? null : version.track.id
                  )}
                >
                  {/* Timeline dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    version.isPrimary 
                      ? 'bg-accent-yellow text-forest-dark' 
                      : 'bg-forest-light text-silver'
                  }`}>
                    {version.isPrimary ? (
                      <Star className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-mono">v{version.versionNumber}</span>
                    )}
                  </div>
                  
                  {/* Version info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-quicksand font-medium text-sm text-silver">
                        {version.versionName}
                      </h5>
                      {version.isPrimary && (
                        <span className="px-2 py-0.5 bg-accent-yellow text-forest-dark rounded-full text-xs font-semibold">
                          Primary
                        </span>
                      )}
                      {isCurrentTrack && (
                        <span className="px-2 py-0.5 bg-forest-light text-silver rounded-full text-xs">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-silver/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeDate(version.createdAt)}
                      </span>
                      <span className="text-xs text-silver/60">
                        {formatDuration(version.track.duration)}
                      </span>
                    </div>
                    
                    {/* Changes from previous version */}
                    {differences.length > 0 && (
                      <div className="mt-2 text-xs text-silver/60">
                        Changes: {differences.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVersion(version);
                      }}
                      className="p-2 rounded-full hover:bg-forest-light transition-colors"
                      title={isPlayingThis ? "Pause" : "Play"}
                    >
                      {isPlayingThis ? (
                        <Pause className="w-4 h-4 text-accent-yellow" />
                      ) : (
                        <Play className="w-4 h-4 text-silver" />
                      )}
                    </button>
                    
                    <ChevronRight className={`w-4 h-4 text-silver/60 transition-transform ${
                      selectedVersion === version.track.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </div>
                
                {/* Expanded actions */}
                {selectedVersion === version.track.id && (
                  <div className="ml-11 mt-2 p-3 bg-forest-light/20 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      {!version.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(version.track.id)}
                          className="flex-1 px-3 py-1.5 bg-accent-yellow/20 text-accent-yellow rounded text-xs hover:bg-accent-yellow/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <Star className="w-3 h-3" />
                          Set as Primary
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          // Download functionality would go here
                        }}
                        className="flex-1 px-3 py-1.5 bg-forest-light text-silver rounded text-xs hover:bg-forest-light/80 transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      
                      {versions.length > 1 && (
                        <button
                          onClick={() => handleDeleteVersion(version.track.id)}
                          className="px-3 py-1.5 bg-forest-light text-accent-coral rounded text-xs hover:bg-accent-coral/20 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                    
                    {/* Version metadata */}
                    <div className="text-xs text-silver/60 space-y-1">
                      {version.track.key && <div>Key: {version.track.key}</div>}
                      {version.track.tempo && <div>Tempo: {version.track.tempo} BPM</div>}
                      {version.track.genre && <div>Genre: {version.track.genre}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Version comparison hint */}
      {versions.length > 1 && (
        <div className="text-xs text-silver/60 text-center pt-2">
          Tip: Click on a version to see more options and details
        </div>
      )}
    </div>
  );
};

export default VersionHistory;