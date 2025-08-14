import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AudioProvider, useAudio } from '../contexts/AudioContext';
import { LibraryProvider, useLibrary } from '../contexts/LibraryContext';
import { ToastProvider } from '../contexts/ToastContext';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import TrackList from './Library/TrackList';
import PlayerBar from './Player/PlayerBar';
import FileUpload from './Upload/FileUpload';
import AdminDashboard from './Admin/AdminDashboard';
import TrackDetailsPanel from './TrackDetails/TrackDetailsPanel';
import TutorialWrapper from './Tutorial/TutorialWrapper';
import TasksSummary from '../pages/TasksSummary';
import { useAutoAcceptShares } from '../hooks/useAutoAcceptShares';
import { useErrorToast } from '../hooks/useErrorToast';
import { Track, TrackCategory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { debugPlaylistAccess } from '../utils/debugSupabase';
import { debugPlaylistShare } from '../utils/debugPlaylistShare';

const MainAppContent: React.FC = () => {
  const { isAdmin } = useAuth();
  const { play } = useAudio();
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Auto-accept any pending playlist shares on login
  useAutoAcceptShares();
  
  // Connect error events to toast notifications
  useErrorToast();

  useEffect(() => {
    // Make debug functions available in console
    if (typeof window !== 'undefined') {
      (window as any).debugPlaylistAccess = debugPlaylistAccess;
      (window as any).debugPlaylistShare = debugPlaylistShare;
      // Debug functions available: window.debugPlaylistAccess(), window.debugPlaylistShare()
    }
  }, []);

  return (
    <LibraryProvider>
      <MainAppInner 
        isAdmin={isAdmin}
        play={play}
        showAdmin={showAdmin}
        setShowAdmin={setShowAdmin}
      />
    </LibraryProvider>
  );
};

interface MainAppInnerProps {
  isAdmin: boolean;
  play: (trackId: string, url: string) => void;
  showAdmin: boolean;
  setShowAdmin: (show: boolean) => void;
}

const MainAppInner: React.FC<MainAppInnerProps> = ({ isAdmin, play, showAdmin, setShowAdmin }) => {
  const { tracks, getTracksByCategory, getPlaylistTracks, getAllUsedTags } = useLibrary();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<TrackCategory | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<'listened' | 'liked' | 'loved' | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'library' | 'tasks'>('library');

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };

  // Handle navigation from Tasks Summary
  useEffect(() => {
    if (location.state && (location.state as any).selectedTrackId) {
      const trackId = (location.state as any).selectedTrackId;
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        setSelectedTrack(track);
        setActiveView('library');
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, tracks]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear selected tags that no longer exist on any tracks
  useEffect(() => {
    if (selectedTags.length > 0) {
      const usedTags = getAllUsedTags().map(({ tag }) => tag);
      const validSelectedTags = selectedTags.filter(tag => usedTags.includes(tag));
      
      // If any selected tags no longer exist, update the selection
      if (validSelectedTags.length !== selectedTags.length) {
        setSelectedTags(validSelectedTags);
      }
    }
  }, [tracks, selectedTags, getAllUsedTags]);

  if (showAdmin && isAdmin) {
    return (
      <AdminDashboard onClose={() => setShowAdmin(false)} />
    );
  }

  // Calculate column widths based on whether track details are shown
  const sidebarWidth = 'w-[280px]'; // Will be handled by sidebar component itself
  const trackListWidth = selectedTrack ? 'w-[280px]' : 'flex-1';
  const detailsPanelWidth = 'flex-1';

  return (
    <div className="h-screen bg-forest-dark flex flex-col overflow-hidden">
          {/* Tutorial for new users */}
          <TutorialWrapper />
          
          {/* Fixed Header */}
          <Header 
            onUploadClick={() => setShowUpload(true)}
            onAdminClick={isAdmin ? () => setShowAdmin(true) : undefined}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          
          {/* Main Content Area with dynamic columns */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column - Sidebar */}
            <div className="flex-shrink-0 bg-forest-main border-r border-forest-light overflow-y-auto transition-all duration-300">
              <Sidebar 
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                selectedCollection={selectedCollection}
                onCollectionSelect={setSelectedCollection}
                selectedRating={selectedRating}
                onRatingSelect={setSelectedRating}
                selectedPlaylist={selectedPlaylist}
                onPlaylistSelect={setSelectedPlaylist}
                activeView={activeView}
                onViewChange={setActiveView}
              />
            </div>
            
            {/* Main Content Area */}
            {activeView === 'tasks' ? (
              // Tasks Summary View
              <div className="flex-1 bg-forest-main overflow-y-auto">
                <TasksSummary />
              </div>
            ) : (
              <>
                {/* Middle Column - Track List */}
                {/* Note: Original color was bg-forest-dark (#0a1612), changed to bg-[#213129] for lighter shade */}
                <div className={`${trackListWidth} flex flex-col bg-[#213129] transition-all duration-300 relative z-30 ${selectedTrack ? 'border-r border-forest-light' : ''}`}>
                  <div className="flex-1 flex flex-col w-full overflow-hidden">
                    {/* Track Library */}
                    <div className="bg-forest-main flex-1 flex flex-col overflow-hidden">
                      <TrackList
                        category={activeCategory}
                        onTrackSelect={handleTrackSelect}
                        selectedTags={selectedTags}
                        selectedCollection={selectedCollection}
                        selectedRating={selectedRating}
                        selectedPlaylist={selectedPlaylist}
                        selectedTrack={selectedTrack}
                        compactMode={!!selectedTrack}
                        searchQuery={searchQuery}
                        onTagToggle={handleTagToggle}
                        onCollectionSelect={setSelectedCollection}
                        onRatingSelect={setSelectedRating}
                        onSearchChange={setSearchQuery}
                        onPlaylistSelect={setSelectedPlaylist}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Track Details (Conditional) */}
                {selectedTrack && (
                  <div className={`${detailsPanelWidth} bg-forest-main overflow-hidden animate-slide-in-right`}>
                    <TrackDetailsPanel
                      track={selectedTrack}
                      onClose={() => setSelectedTrack(null)}
                      playlistId={selectedPlaylist}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Fixed Player Bar - Now using inline player in header */}
          {/* {!selectedTrack && <PlayerBar />} */}
          
          {/* Upload Modal */}
          {showUpload && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-forest-main rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <h2 className="font-anton text-xl text-silver">Upload Music</h2>
                    {uploadedCount > 0 && (
                      <span className="font-quicksand text-sm text-accent-yellow">
                        {uploadedCount} file{uploadedCount !== 1 ? 's' : ''} uploaded
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUpload(false);
                      setUploadedCount(0);
                    }}
                    className="bg-accent-coral text-silver px-4 py-2 rounded-lg font-quicksand font-medium hover:bg-accent-coral/90 transition-colors"
                  >
                    Close
                  </button>
                </div>
                
                <FileUpload
                  onUploadStart={() => setUploadedCount(0)}
                  onUploadComplete={(track) => {
                    setUploadedCount(prev => prev + 1);
                  }}
                />
              </div>
            </div>
          )}
    </div>
  );
};

const MainApp: React.FC = () => {
  return (
    <AudioProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AudioProvider>
  );
};

export default MainApp;