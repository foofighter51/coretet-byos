import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Upload, Music, Search, Tag, Share2, Heart, Settings, MessageSquare, Play, Grid, List as ListIcon, GripVertical, Paperclip, Headphones, ThumbsUp, Copy, StickyNote, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TutorialStep {
  title: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  highlight?: string; // CSS selector for element to highlight
}

interface TutorialModalProps {
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to Coretet!",
      icon: <Music className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>Hi {profile?.display_name || 'there'}! Let's take a quick tour of Coretet, your personal music library in the cloud.</p>
          <p>Coretet helps you organize, play, and share your music collection with powerful features designed for musicians and music lovers.</p>
          <div className="bg-forest-light/50 rounded-lg p-4 mt-4">
            <p className="text-sm">💡 <strong>Tip:</strong> You can access this tutorial anytime from your account menu.</p>
          </div>
        </div>
      )
    },
    {
      title: "Upload Your Music",
      icon: <Upload className="w-8 h-8 text-accent-yellow" />,
      highlight: '[data-tutorial="upload-button"]',
      content: (
        <div className="space-y-4">
          <p>Start by uploading your music files. Click the <strong>Upload</strong> button in the top navigation.</p>
          <ul className="space-y-2 ml-4">
            <li>• Supports MP3, WAV, FLAC, and more</li>
            <li>• Drag and drop multiple files at once</li>
            <li>• Automatic metadata extraction</li>
            <li>• Files are securely stored in your personal library</li>
          </ul>
          <div className="bg-forest-light/50 rounded-lg p-4 mt-4">
            <p className="text-sm">📁 Files are organized by upload date and can be sorted multiple ways.</p>
          </div>
        </div>
      )
    },
    {
      title: "Organize with Categories",
      icon: <Tag className="w-8 h-8 text-accent-yellow" />,
      highlight: '[data-tutorial="sidebar"]',
      content: (
        <div className="space-y-4">
          <p>Organize your tracks into meaningful categories:</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-forest-light/50 rounded p-3">
              <strong>Songs</strong>
              <p className="text-sm text-silver/80">Completed tracks</p>
            </div>
            <div className="bg-forest-light/50 rounded p-3">
              <strong>Demos</strong>
              <p className="text-sm text-silver/80">Work in progress</p>
            </div>
            <div className="bg-forest-light/50 rounded p-3">
              <strong>Ideas</strong>
              <p className="text-sm text-silver/80">Quick sketches</p>
            </div>
            <div className="bg-forest-light/50 rounded p-3">
              <strong>Voice Memos</strong>
              <p className="text-sm text-silver/80">Recordings on the go</p>
            </div>
          </div>
          <p className="text-sm mt-4">Each track can be easily recategorized as it evolves.</p>
        </div>
      )
    },
    {
      title: "Smart Search & Filters",
      icon: <Search className="w-8 h-8 text-accent-yellow" />,
      highlight: '[data-tutorial="search"]',
      content: (
        <div className="space-y-4">
          <p>Find any track instantly with powerful search and filtering:</p>
          <ul className="space-y-2 ml-4">
            <li>• <strong>Search bar</strong> in the left sidebar searches all metadata</li>
            <li>• <strong>Tags</strong> for custom organization (genre, mood, project)</li>
            <li>• <strong>Filter</strong> by type, rating, or primary tracks only</li>
            <li>• <strong>Sort</strong> by date, title, artist, or duration</li>
          </ul>
          <div className="bg-forest-light/50 rounded-lg p-4 mt-4">
            <p className="text-sm">🏷️ Create custom tags like "needs-mixing" or "client-approved"</p>
          </div>
        </div>
      )
    },
    {
      title: "Track Details View",
      icon: <Music className="w-8 h-8 text-accent-yellow" />,
      highlight: '[data-tutorial="track-list"]',
      content: (
        <div className="space-y-4">
          <p>Double-click any track to open the comprehensive details panel:</p>
          
          <div className="space-y-3">
            <div className="bg-forest-light/50 rounded-lg p-3">
              <h4 className="font-semibold text-accent-yellow mb-2">🎵 Waveform & Playback</h4>
              <p className="text-sm text-silver/80">Professional DAW-style waveform with precise navigation, playback controls, and volume adjustment</p>
            </div>
            
            <div className="bg-forest-light/50 rounded-lg p-3">
              <h4 className="font-semibold text-accent-yellow mb-2">📝 Track Information</h4>
              <p className="text-sm text-silver/80">Edit metadata: Title, Artist, Album, Type, Key, Tempo, Time Signature, Genre, and Mood</p>
            </div>
            
            <div className="bg-forest-light/50 rounded-lg p-3">
              <h4 className="font-semibold text-accent-yellow mb-2">🏷️ Tags</h4>
              <p className="text-sm text-silver/80">Add custom tags for organization - create your own or use suggestions</p>
            </div>
            
            <div className="bg-forest-light/50 rounded-lg p-3">
              <h4 className="font-semibold text-accent-yellow mb-2">📔 Notes</h4>
              <p className="text-sm text-silver/80">Add timestamped notes and comments. Perfect for production notes, mix feedback, or creative ideas</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Track Variations",
      icon: <Copy className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>Manage different versions of your tracks with the Variations feature:</p>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-accent-yellow/20 text-accent-yellow px-2 py-0.5 rounded-full text-xs font-mono">3</div>
              <div className="flex-1">
                <p className="text-sm"><strong>Variation Count</strong> - Shows in the VAR column</p>
                <p className="text-xs text-silver/60">Click to see all versions of a track</p>
              </div>
            </div>
            
            <div className="bg-forest-light/50 rounded-lg p-4">
              <p className="font-semibold mb-2">Use variations for:</p>
              <ul className="space-y-1 text-sm text-silver/80">
                <li>• Different mixes (radio edit, extended, instrumental)</li>
                <li>• Alternative arrangements</li>
                <li>• Work-in-progress versions</li>
                <li>• Stems and multitrack exports</li>
              </ul>
            </div>
            
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-4">
              <p className="text-sm">💡 <strong>Tip:</strong> Select multiple tracks and click "Variations" to group them together!</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Playlists & Collections",
      icon: <ListIcon className="w-8 h-8 text-accent-yellow" />,
      highlight: '[data-tutorial="playlists"]',
      content: (
        <div className="space-y-4">
          <p>Create playlists to group tracks for any purpose:</p>
          <ul className="space-y-2 ml-4">
            <li>• <strong>Manual ordering</strong> - Drag tracks to reorder</li>
            <li>• <strong>Collaborative playlists</strong> - Share with other users</li>
            <li>• <strong>Smart organization</strong> - Tracks can be in multiple playlists</li>
          </ul>
          <div className="flex items-center space-x-2 mt-4 p-3 bg-forest-light/50 rounded-lg">
            <GripVertical className="w-4 h-4 text-silver/60" />
            <p className="text-sm">Select "Manual Order" from sort menu, then drag to reorder</p>
          </div>
        </div>
      )
    },
    {
      title: "Ratings & Organization",
      icon: <Heart className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>Use the rating system to track your progress:</p>
          <div className="space-y-3 mt-4">
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg bg-accent-yellow/20 text-accent-yellow">
                <Headphones className="w-5 h-5" />
              </button>
              <div>
                <strong>Listened</strong>
                <p className="text-sm text-silver/80">Mark tracks you've reviewed</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg bg-accent-yellow/20 text-accent-yellow">
                <ThumbsUp className="w-5 h-5" />
              </button>
              <div>
                <strong>Liked</strong>
                <p className="text-sm text-silver/80">Tracks with potential</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg bg-accent-coral/20 text-accent-coral">
                <Heart className="w-5 h-5" />
              </button>
              <div>
                <strong>Loved</strong>
                <p className="text-sm text-silver/80">Your best work</p>
              </div>
            </div>
          </div>
          <div className="bg-forest-light/50 rounded-lg p-4 mt-4">
            <p className="text-sm">💡 <strong>Tip:</strong> Use ratings to filter your library and find tracks quickly!</p>
          </div>
        </div>
      )
    },
    {
      title: "Share & Collaborate",
      icon: <Share2 className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>Share your playlists and collaborate with others:</p>
          
          <div className="bg-forest-light/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">How to Share:</h4>
            <ol className="space-y-1 text-sm text-silver/80">
              <li>1. Hover over any playlist in the sidebar</li>
              <li>2. Click the share icon that appears</li>
              <li>3. Enter collaborator's email address</li>
              <li>4. They'll receive an invitation to join</li>
            </ol>
          </div>
          
          <div className="bg-forest-light/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Collaborative Features:</h4>
            <ul className="space-y-1 text-sm text-silver/80">
              <li>• <strong>Shared Ratings</strong> - See how collaborators rate each track</li>
              <li>• <strong>Real-time Updates</strong> - Changes sync instantly</li>
              <li>• <strong>Secure Access</strong> - Only invited users can view</li>
              <li>• <strong>Email Notifications</strong> - Get notified of new shares</li>
            </ul>
          </div>
          
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-4">
            <p className="text-sm">🎵 Perfect for band collaboration, client feedback, or sharing demos!</p>
          </div>
        </div>
      )
    },
    {
      title: "View Modes",
      icon: <Grid className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>Choose how you want to see your music:</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-forest-light/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ListIcon className="w-5 h-5 text-accent-yellow" />
                <strong>List View</strong>
              </div>
              <p className="text-sm text-silver/80">Detailed table with all metadata visible</p>
            </div>
            <div className="bg-forest-light/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Grid className="w-5 h-5 text-accent-yellow" />
                <strong>Grid View</strong>
              </div>
              <p className="text-sm text-silver/80">Visual cards with album-style layout</p>
            </div>
          </div>
          <p className="text-sm mt-4">Views are remembered per playlist, category, and filter combination.</p>
        </div>
      )
    },
    {
      title: "Send Feedback",
      icon: <MessageSquare className="w-8 h-8 text-accent-yellow" />,
      highlight: '[data-tutorial="feedback"]',
      content: (
        <div className="space-y-4">
          <p>We're constantly improving Coretet based on your feedback!</p>
          <ul className="space-y-2 ml-4">
            <li>• Click the <strong>Feedback</strong> tab to send suggestions</li>
            <li>• Report bugs or request features</li>
            <li>• <strong>New:</strong> Attach screenshots or files!</li>
          </ul>
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-accent-yellow" />
              <p className="text-sm">Drag and drop files directly into the feedback form</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Keyboard Shortcuts",
      icon: <Settings className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>Speed up your workflow with keyboard shortcuts:</p>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between">
              <span className="font-mono text-sm bg-forest-light px-2 py-1 rounded">Space</span>
              <span className="text-sm">Play/Pause</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-sm bg-forest-light px-2 py-1 rounded">Cmd/Ctrl + A</span>
              <span className="text-sm">Select all tracks</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-sm bg-forest-light px-2 py-1 rounded">Esc</span>
              <span className="text-sm">Clear selection</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-sm bg-forest-light px-2 py-1 rounded">Double Click</span>
              <span className="text-sm">Open track details</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Coming Soon",
      icon: <Sparkles className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>We're building exciting new features to enhance your music workflow:</p>
          <div className="space-y-4 mt-4">
            <div className="bg-forest-light/50 rounded-lg p-4">
              <h4 className="font-semibold text-accent-yellow mb-2">💬 Commenting</h4>
              <p className="text-sm text-silver/80">Add timestamped comments to tracks. Perfect for production notes, mix feedback, or collaboration.</p>
            </div>
            <div className="bg-forest-light/50 rounded-lg p-4">
              <h4 className="font-semibold text-accent-yellow mb-2">🎵 Track Rearrangements</h4>
              <p className="text-sm text-silver/80">Create and link alternate arrangements of your songs. Keep all versions connected and organized.</p>
            </div>
            <div className="bg-forest-light/50 rounded-lg p-4">
              <h4 className="font-semibold text-accent-yellow mb-2">🤖 AI Analysis</h4>
              <p className="text-sm text-silver/80">Get intelligent insights about your music - tempo detection, key analysis, mood suggestions, and more.</p>
            </div>
          </div>
          <p className="text-sm text-silver/60 mt-4">Stay tuned for these updates!</p>
        </div>
      )
    },
    {
      title: "You're Ready!",
      icon: <Play className="w-8 h-8 text-accent-yellow" />,
      content: (
        <div className="space-y-4">
          <p>That's it! You now know all the essentials of Coretet.</p>
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-4 mt-4">
            <p className="font-semibold mb-2">Quick Start:</p>
            <ol className="space-y-1 text-sm">
              <li>1. Upload some music files</li>
              <li>2. Organize them with categories and tags</li>
              <li>3. Create your first playlist</li>
              <li>4. Explore the track details view</li>
            </ol>
          </div>
          <p className="text-sm text-silver/80 mt-4">Remember, you can always access this tutorial from your account menu. Happy organizing! 🎵</p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    localStorage.setItem('coretet_tutorial_seen', 'true');
    onClose();
  };

  const completeTutorial = () => {
    localStorage.setItem('coretet_tutorial_seen', 'true');
    setHasSeenTutorial(true);
    onClose();
  };

  // Check if user has seen tutorial
  useEffect(() => {
    const seen = localStorage.getItem('coretet_tutorial_seen');
    setHasSeenTutorial(seen === 'true');
  }, []);

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
      <div className="bg-forest-main rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-forest-light flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentTutorialStep.icon}
            <h2 className="font-anton text-xl text-silver">
              {currentTutorialStep.title}
            </h2>
          </div>
          <button
            onClick={skipTutorial}
            className="text-silver/60 hover:text-silver transition-colors"
            title="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="text-silver font-quicksand">
            {currentTutorialStep.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-forest-light">
          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-accent-yellow w-6'
                      : index < currentStep
                      ? 'bg-accent-yellow/50'
                      : 'bg-forest-light'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center space-x-3">
              {currentStep === 0 && !hasSeenTutorial && (
                <button
                  onClick={skipTutorial}
                  className="px-4 py-2 text-silver/60 font-quicksand text-sm hover:text-silver transition-colors"
                >
                  Skip Tutorial
                </button>
              )}
              
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors flex items-center space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}
              
              {currentStep < tutorialSteps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={completeTutorial}
                  className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium hover:bg-accent-yellow/90 transition-colors"
                >
                  Get Started!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;