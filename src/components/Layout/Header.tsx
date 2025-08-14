import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, MessageSquare, User, ChevronDown, Archive, Key, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SimpleFeedbackModal from '../Feedback/SimpleFeedbackModal';
import DeletedTracksModal from '../Library/DeletedTracksModal';
import ProfileSettingsModal from '../Account/ProfileSettingsModal';
import PasswordResetModal from '../Account/PasswordResetModal';
import TutorialModal from '../Tutorial/TutorialModal';
import InteractiveTutorial from '../Tutorial/InteractiveTutorial';
import EnhancedSearch from './EnhancedSearch';
import ThemeSelector from '../ThemeSelector/ThemeSelector';

interface HeaderProps {
  onUploadClick: () => void;
  onAdminClick?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onUploadClick, onAdminClick, searchQuery, onSearchChange }) => {
  const { signOut, profile, isAdmin } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDeletedTracks, setShowDeletedTracks] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const formatStorageUsed = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-forest-dark border-b border-forest-light">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          <div>
            <h1 className="font-anton text-xl text-silver">CoreTet</h1>
          </div>
          
          {/* Enhanced Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <EnhancedSearch 
              value={searchQuery} 
              onChange={onSearchChange} 
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Selector */}
            <ThemeSelector />
            
            {isAdmin && onAdminClick && (
              <button
                onClick={onAdminClick}
                className="flex items-center space-x-2 text-silver/80 hover:text-silver transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="font-quicksand text-sm">Admin</span>
              </button>
            )}
            
            <button
              onClick={() => setShowFeedback(true)}
              className="bg-forest-main text-silver px-3 py-2 rounded-lg font-quicksand font-medium hover:bg-forest-main/80 transition-colors flex items-center space-x-2"
              data-tutorial="feedback"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </button>
            
            <button
              onClick={onUploadClick}
              className="bg-accent-yellow text-forest-dark px-4 py-2 rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
              data-tutorial="upload-button"
            >
              Upload Music
            </button>
            
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center space-x-2 bg-forest-main text-silver px-3 py-2 rounded-lg font-quicksand font-medium hover:bg-forest-main/80 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Account</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-forest-main border border-forest-light rounded-lg shadow-lg z-50">
                  {profile && (
                    <>
                      <div className="px-4 py-3 border-b border-forest-light">
                        <p className="font-quicksand text-sm text-silver">{profile.email}</p>
                        <p className="font-quicksand text-xs text-silver/60 mt-1">
                          Storage: {formatStorageUsed(profile.storage_used)} / 1.0 GB
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowProfileSettings(true);
                            setShowAccountMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-silver/80 hover:bg-forest-light/50 hover:text-silver transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span className="font-quicksand text-sm">Profile Settings</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowPasswordReset(true);
                            setShowAccountMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-silver/80 hover:bg-forest-light/50 hover:text-silver transition-colors"
                        >
                          <Key className="w-4 h-4" />
                          <span className="font-quicksand text-sm">Change Password</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowDeletedTracks(true);
                            setShowAccountMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-silver/80 hover:bg-forest-light/50 hover:text-silver transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          <span className="font-quicksand text-sm">Deleted Tracks</span>
                        </button>
                        
                        <div className="my-2 border-t border-forest-light"></div>
                        
                        <button
                          onClick={() => {
                            setShowTutorial(true);
                            setShowAccountMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-silver/80 hover:bg-forest-light/50 hover:text-silver transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span className="font-quicksand text-sm">View Tutorial</span>
                        </button>
                        
                        <div className="my-2 border-t border-forest-light"></div>
                        
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-silver/80 hover:bg-forest-light/50 hover:text-silver transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-quicksand text-sm">Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-forest-main px-3 py-1 rounded-full">
              <span className="font-quicksand text-sm text-accent-yellow">Beta Version</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feedback Modal */}
      {showFeedback && (
        <SimpleFeedbackModal onClose={() => setShowFeedback(false)} />
      )}
      
      {/* Deleted Tracks Modal */}
      {showDeletedTracks && (
        <DeletedTracksModal 
          isOpen={showDeletedTracks} 
          onClose={() => setShowDeletedTracks(false)} 
        />
      )}
      
      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettingsModal 
          isOpen={showProfileSettings} 
          onClose={() => setShowProfileSettings(false)} 
        />
      )}
      
      {/* Password Reset Modal */}
      {showPasswordReset && (
        <PasswordResetModal 
          isOpen={showPasswordReset} 
          onClose={() => setShowPasswordReset(false)} 
        />
      )}
      
      {/* Tutorial Modal - Now shows interactive version */}
      {showTutorial && (
        <InteractiveTutorial onClose={() => setShowTutorial(false)} />
      )}
    </header>
  );
};

export default Header;