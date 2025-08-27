import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchBar } from '../Navigation/SearchBar';
import { AccountDropdown } from '../Navigation/AccountDropdown';
import { FeedbackModal } from '../Navigation/FeedbackModal';
import { SecondaryToolbar } from '../Navigation/SecondaryToolbar';
import InlinePlayer from '../../../components/Player/InlinePlayer';

interface V2LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showSecondaryToolbar?: boolean;
}

export function V2Layout({ children, title, subtitle, showSecondaryToolbar = false }: V2LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);

  const isCurrentPage = (path: string) => location.pathname === path;

  return (
    <div className="v2-layout bg-forest-dark">
      {/* Primary Navigation Bar */}
      <header className="bg-forest-main border-b border-forest-light flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="font-anton text-xl sm:text-2xl text-silver hover:text-white transition-colors"
            >
              CoreTet
            </button>
            
            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Upload Music Button */}
              <button
                onClick={() => {
                  // For now, navigate to tracks page which has the upload modal
                  if (location.pathname !== '/tracks') {
                    navigate('/tracks');
                  }
                  // TODO: Trigger upload modal directly
                }}
                className="bg-accent-yellow text-forest-dark px-4 sm:px-6 py-2 rounded-lg font-quicksand font-semibold hover:bg-accent-yellow/90 transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Upload Music</span>
                <span className="sm:hidden">Upload</span>
              </button>

              {/* Feedback Button */}
              <button
                onClick={() => setShowFeedback(true)}
                className="text-silver/60 hover:text-silver transition-colors p-2"
                title="Beta Feedback"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* Account Dropdown */}
              <AccountDropdown />
            </div>
          </div>

          {/* Secondary Navigation */}
          <nav className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-forest-light/30">
            <div className="flex items-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
              <button
                onClick={() => navigate('/tracks')}
                className={`transition-colors font-quicksand text-xs sm:text-sm ${
                  isCurrentPage('/tracks') 
                    ? 'text-accent-yellow' 
                    : 'text-silver/60 hover:text-silver'
                }`}
              >
                Tracks
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}

      {/* Secondary Toolbar */}
      {showSecondaryToolbar && <SecondaryToolbar />}

      {/* Page Header */}
      {(title || subtitle) && (
        <div className="border-b border-forest-light bg-forest-main/50 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-anton text-white mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-silver/70 font-quicksand text-sm sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="v2-content v2-scrollable">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}