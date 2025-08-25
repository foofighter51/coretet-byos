import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TutorialStep {
  title: string;
  content: string;
  target: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right'; // Where to show the tooltip
  action?: () => void; // Optional action to perform
}

interface InteractiveTutorialProps {
  onClose: () => void;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ onClose }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to Coretet!",
      content: `Hi ${profile?.display_name || 'there'}! Let's take a quick tour. I'll show you around the interface and help you get started.`,
      target: 'body',
      position: 'bottom'
    },
    {
      title: "Upload Your Music",
      content: "Click here to upload your music files. We support MP3, WAV, FLAC and more. You can drag and drop multiple files at once.",
      target: '[data-tutorial="upload-button"]',
      position: 'bottom'
    },
    {
      title: "Your Library",
      content: "This sidebar is your command center. Browse by categories, search for tracks, manage playlists, and filter by tags or ratings.",
      target: '[data-tutorial="sidebar"]',
      position: 'right'
    },
    {
      title: "Search Everything",
      content: "Use the search bar to find any track instantly. It searches through titles, artists, albums, and all metadata.",
      target: '[data-tutorial="search-input"]',
      position: 'right'
    },
    {
      title: "Track Categories",
      content: "Organize your music into categories: Songs, Demos, Ideas, Voice Memos, and more. Each track can be easily recategorized as it evolves.",
      target: '[data-tutorial="categories"]',
      position: 'right'
    },
    {
      title: "Your Track List",
      content: "Here's where your music lives. Double-click any track to see detailed information, or use the play button to start listening.",
      target: '[data-tutorial="track-list"]',
      position: 'left'
    },
    {
      title: "Sort and Filter",
      content: "Use these controls to sort by date, title, artist, or duration. Filter by type, rating, or show only primary tracks.",
      target: '[data-tutorial="sort-filter"]',
      position: 'bottom'
    },
    {
      title: "View Modes",
      content: "Switch between List and Grid views. Your preference is remembered for each category, playlist, and filter combination.",
      target: '[data-tutorial="view-toggle"]',
      position: 'bottom'
    },
    {
      title: "Track Details",
      content: "Double-click any track to open the details panel. Edit metadata, add tags, write notes, and see the waveform visualization.",
      target: '[data-tutorial="track-row"]',
      position: 'top'
    },
    {
      title: "Track Variations",
      content: "Manage different versions of your tracks! When you see a number in the VAR column, click it to view all variations. You can group multiple tracks together as variations of the same song - perfect for different mixes, stems, or work-in-progress versions.",
      target: '[data-tutorial="track-list"]',
      position: 'left'
    },
    {
      title: "Create Playlists",
      content: "Click the + button to create playlists. You can share them with collaborators and reorder tracks manually.",
      target: '[data-tutorial="playlist-create"]',
      position: 'right'
    },
    {
      title: "Share Playlists",
      content: "Hover over any playlist to see the share icon. Click it to invite collaborators via email. They'll receive an invitation to view and rate tracks in your playlist. Perfect for band collaboration or sharing demos with clients!",
      target: '[data-tutorial="playlist-create"]',
      position: 'right'
    },
    {
      title: "Collaborative Ratings",
      content: "When you share a playlist, collaborators can rate tracks as Listened, Liked, or Loved. You'll see their ratings alongside yours, making it easy to gather feedback and make decisions together.",
      target: '[data-tutorial="sidebar"]',
      position: 'right'
    },
    {
      title: "Player Controls",
      content: "Your music player stays at the bottom. Control playback, see what's playing, and adjust volume from anywhere in the app.",
      target: '[data-tutorial="player-bar"]',
      position: 'top'
    },
    {
      title: "Coming Soon",
      content: "We're building exciting new features:\n\n• Commenting - Add timestamped comments to tracks\n• Track Rearrangements - Create alternate arrangements and link them\n• AI Analysis - Get intelligent insights about your music\n\nStay tuned for these updates!",
      target: 'body',
      position: 'bottom'
    },
    {
      title: "Send Feedback",
      content: "We're constantly improving! Click here to send suggestions, report bugs, or share ideas. You can even attach screenshots!",
      target: '[data-tutorial="feedback"]',
      position: 'bottom'
    },
    {
      title: "You're Ready!",
      content: "That's the basics! Start by uploading some music, then explore all the features. You can access this tutorial anytime from your account menu.",
      target: 'body',
      position: 'bottom'
    }
  ];

  // Calculate highlight box position
  useEffect(() => {
    const updateHighlight = () => {
      const step = tutorialSteps[currentStep];
      if (step.target === 'body') {
        setHighlightBox(null);
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightBox(rect);
      } else {
        // If element not found, try again after a short delay
        setTimeout(updateHighlight, 500);
      }
    };

    updateHighlight();
    
    // Update on window resize
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);
    
    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [currentStep]);

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!highlightBox || !tooltipRef.current) return {};
    
    const step = tutorialSteps[currentStep];
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const padding = 20;
    const viewportPadding = 40; // Extra padding from viewport edges
    
    const style: React.CSSProperties = {
      position: 'fixed' as const,
      zIndex: 10001
    };
    
    switch (step.position) {
      case 'top':
        style.left = Math.max(
          viewportPadding,
          Math.min(
            window.innerWidth - tooltip.width - viewportPadding,
            highlightBox.left + (highlightBox.width - tooltip.width) / 2
          )
        );
        style.bottom = Math.max(
          viewportPadding,
          window.innerHeight - highlightBox.top + padding
        );
        break;
      case 'bottom':
        style.left = Math.max(
          viewportPadding,
          Math.min(
            window.innerWidth - tooltip.width - viewportPadding,
            highlightBox.left + (highlightBox.width - tooltip.width) / 2
          )
        );
        style.top = Math.min(
          window.innerHeight - tooltip.height - viewportPadding,
          highlightBox.bottom + padding
        );
        break;
      case 'left':
        // For left position, show on right if not enough space
        if (highlightBox.left - tooltip.width - padding < viewportPadding) {
          style.left = highlightBox.right + padding;
        } else {
          style.right = window.innerWidth - highlightBox.left + padding;
        }
        style.top = Math.max(
          viewportPadding,
          Math.min(
            window.innerHeight - tooltip.height - viewportPadding,
            highlightBox.top + (highlightBox.height - tooltip.height) / 2
          )
        );
        break;
      case 'right':
        style.left = Math.min(
          window.innerWidth - tooltip.width - viewportPadding,
          highlightBox.right + padding
        );
        style.top = Math.max(
          viewportPadding,
          Math.min(
            window.innerHeight - tooltip.height - viewportPadding,
            highlightBox.top + (highlightBox.height - tooltip.height) / 2
          )
        );
        break;
    }
    
    return style;
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    localStorage.setItem('coretet_interactive_tutorial_seen', 'true');
    onClose();
  };

  const completeTutorial = () => {
    localStorage.setItem('coretet_interactive_tutorial_seen', 'true');
    onClose();
  };

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <>
      {/* Light gray overlay */}
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={skipTutorial}>
        {/* Highlight cutout */}
        {highlightBox && (
          <div
            className="absolute bg-transparent"
            style={{
              left: highlightBox.left - 8,
              top: highlightBox.top - 8,
              width: highlightBox.width + 16,
              height: highlightBox.height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      {/* Highlighted element click-through */}
      {highlightBox && (
        <div
          className="fixed z-[9999]"
          style={{
            left: highlightBox.left,
            top: highlightBox.top,
            width: highlightBox.width,
            height: highlightBox.height,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10001] bg-forest-main border-2 border-accent-yellow rounded-xl shadow-2xl max-w-sm animate-fade-in"
        style={currentStep === 0 || currentStep === tutorialSteps.length - 1 ? {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        } : getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow pointer */}
        {highlightBox && currentStep !== 0 && currentStep !== tutorialSteps.length - 1 && (
          <div
            className="absolute w-4 h-4 bg-forest-main border-accent-yellow transform rotate-45"
            style={{
              ...(currentTutorialStep.position === 'top' && {
                bottom: -8,
                left: '50%',
                marginLeft: -8,
                borderBottom: '2px solid',
                borderRight: '2px solid'
              }),
              ...(currentTutorialStep.position === 'bottom' && {
                top: -8,
                left: '50%',
                marginLeft: -8,
                borderTop: '2px solid',
                borderLeft: '2px solid'
              }),
              ...(currentTutorialStep.position === 'left' && {
                right: -8,
                top: '50%',
                marginTop: -8,
                borderTop: '2px solid',
                borderRight: '2px solid'
              }),
              ...(currentTutorialStep.position === 'right' && {
                left: -8,
                top: '50%',
                marginTop: -8,
                borderBottom: '2px solid',
                borderLeft: '2px solid'
              })
            }}
          />
        )}

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-anton text-lg text-accent-yellow pr-4">
              {currentTutorialStep.title}
            </h3>
            <button
              onClick={skipTutorial}
              className="text-silver/60 hover:text-silver transition-colors -mt-1"
              title="Skip tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="font-quicksand text-sm text-silver mb-6">
            {currentTutorialStep.content}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex space-x-1.5">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-accent-yellow w-4'
                      : index < currentStep
                      ? 'bg-accent-yellow/50'
                      : 'bg-forest-light'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="p-2 hover:bg-forest-light rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-silver" />
                </button>
              )}
              
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors flex items-center space-x-2"
              >
                <span>{currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}</span>
                {currentStep < tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InteractiveTutorial;