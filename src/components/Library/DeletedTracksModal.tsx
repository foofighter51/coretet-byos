import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Trash2, Clock, Music, Square, CheckSquare } from 'lucide-react';
import { Track } from '../../types';
import { useLibrary } from '../../contexts/LibraryContext';
import { formatDuration } from '../../utils/trackUtils';

interface DeletedTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeletedTracksModal: React.FC<DeletedTracksModalProps> = ({ isOpen, onClose }) => {
  const { getDeletedTracks, restoreTrack, permanentlyDeleteTrack } = useLibrary();
  const [deletedTracks, setDeletedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDeletedTracks();
      setSelectedTracks([]);
    }
  }, [isOpen]);

  const loadDeletedTracks = async () => {
    setLoading(true);
    try {
      const tracks = await getDeletedTracks();
      setDeletedTracks(tracks);
    } catch (error) {
      console.error('Error loading deleted tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTracks.length === deletedTracks.length) {
      setSelectedTracks([]);
    } else {
      setSelectedTracks(deletedTracks.map(t => t.id));
    }
  };

  const handleToggleSelect = (trackId: string) => {
    if (selectedTracks.includes(trackId)) {
      setSelectedTracks(prev => prev.filter(id => id !== trackId));
    } else {
      setSelectedTracks(prev => [...prev, trackId]);
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedTracks.length === 0) return;
    
    setRestoring(true);
    try {
      // Restore each selected track
      for (const trackId of selectedTracks) {
        await restoreTrack(trackId);
      }
      // Remove restored tracks from local state
      setDeletedTracks(prev => prev.filter(t => !selectedTracks.includes(t.id)));
      setSelectedTracks([]);
    } catch (error) {
      console.error('Error restoring tracks:', error);
    } finally {
      setRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDelete) return;
    
    setDeleting(confirmDelete.id);
    try {
      await permanentlyDeleteTrack(confirmDelete.id);
      // Remove from local state
      setDeletedTracks(prev => prev.filter(t => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error permanently deleting track:', error);
    } finally {
      setDeleting(null);
    }
  };

  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt);
    const permanentDeleteDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((permanentDeleteDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-forest-main rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-anton text-xl text-silver">Archive</h3>
            <p className="font-quicksand text-sm text-silver/60 mt-1">
              Deleted tracks are kept for 30 days before permanent deletion
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-silver/60 hover:text-silver transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk Actions */}
        {deletedTracks.length > 0 && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-forest-light">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-silver/60 hover:text-silver transition-colors"
            >
              {selectedTracks.length === deletedTracks.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="font-quicksand text-sm">
                {selectedTracks.length === deletedTracks.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            
            {selectedTracks.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="font-quicksand text-sm text-silver/60">
                  {selectedTracks.length} selected
                </span>
                <button
                  onClick={handleRestoreSelected}
                  disabled={restoring}
                  className="px-4 py-1.5 bg-accent-yellow text-forest-dark rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{restoring ? 'Restoring...' : `Restore ${selectedTracks.length} Track${selectedTracks.length > 1 ? 's' : ''}`}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-quicksand text-silver/60">Loading deleted tracks...</p>
          </div>
        ) : deletedTracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Trash2 className="w-12 h-12 text-silver/20 mb-4" />
            <p className="font-quicksand text-silver/60">No deleted tracks</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {deletedTracks.map((track) => {
                const daysLeft = getDaysUntilPermanentDelete(track.deleted_at!);
                const isSelected = selectedTracks.includes(track.id);
                const isDeleting = deleting === track.id;
                
                return (
                  <div
                    key={track.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                      isSelected ? 'bg-accent-yellow/10 hover:bg-accent-yellow/20' : 'bg-forest-light/50 hover:bg-forest-light/70'
                    }`}
                    onClick={() => handleToggleSelect(track.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(track.id);
                      }}
                      className="text-silver/60 hover:text-silver transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-accent-yellow" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    
                    <Music className="w-4 h-4 text-silver/40" />
                    
                    <div className="flex-1">
                      <p className="font-quicksand text-sm text-silver font-medium">{track.name}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="font-quicksand text-xs text-silver/60">
                          {track.category.replace('-', ' ')}
                        </span>
                        {track.artist && (
                          <span className="font-quicksand text-xs text-silver/60">
                            {track.artist}
                          </span>
                        )}
                        {track.collection && (
                          <span className="font-quicksand text-xs text-silver/60">
                            {track.collection}
                          </span>
                        )}
                        <span className="font-quicksand text-xs text-silver/60">
                          {formatDuration(track.duration)}
                        </span>
                        {track.deleted_at && (
                          <span className="font-quicksand text-xs text-silver/60">
                            Deleted {new Date(track.deleted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 text-xs">
                        <Clock className="w-3 h-3 text-silver/40" />
                        <span className={`font-quicksand ${daysLeft <= 7 ? 'text-accent-coral' : 'text-silver/60'}`}>
                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ id: track.id, name: track.name });
                        }}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-accent-coral hover:bg-accent-coral/10 rounded-lg font-quicksand text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Permanent Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
          <div className="bg-forest-main rounded-xl p-6 max-w-md w-full mx-4 animate-slide-up">
            <h3 className="font-anton text-xl text-silver mb-4">Delete Forever?</h3>
            <p className="font-quicksand text-silver/80 mb-6">
              Are you sure you want to permanently delete <span className="text-accent-yellow font-medium">"{confirmDelete.name}"</span>?
              <br />
              <span className="text-accent-coral text-sm">This action cannot be undone and will free up storage space.</span>
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={!!deleting}
                className="px-4 py-2 bg-accent-coral text-silver rounded-lg font-quicksand font-medium hover:bg-accent-coral/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedTracksModal;