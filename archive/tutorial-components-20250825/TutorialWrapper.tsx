import React, { useState, useEffect } from 'react';
import TutorialModal from './TutorialModal';
import InteractiveTutorial from './InteractiveTutorial';
import { useAuth } from '../../contexts/AuthContext';

const TutorialWrapper: React.FC = () => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialMode, setTutorialMode] = useState<'standard' | 'interactive'>('interactive');

  useEffect(() => {
    if (user) {
      // Check if user has seen either version of the tutorial
      const hasSeenStandardTutorial = localStorage.getItem('coretet_tutorial_seen');
      const hasSeenInteractiveTutorial = localStorage.getItem('coretet_interactive_tutorial_seen');
      
      // Check if this is a new user (e.g., account created in last 5 minutes)
      const userCreatedAt = new Date(user.created_at || '');
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isNewUser = userCreatedAt > fiveMinutesAgo;
      
      // Show tutorial if user hasn't seen it and they're new
      if (!hasSeenStandardTutorial && !hasSeenInteractiveTutorial && isNewUser) {
        // Delay slightly to let the app load
        setTimeout(() => {
          setShowTutorial(true);
        }, 1000);
      }
    }
  }, [user]);

  if (!showTutorial) return null;

  // Use interactive tutorial by default for new users
  return tutorialMode === 'interactive' ? (
    <InteractiveTutorial onClose={() => setShowTutorial(false)} />
  ) : (
    <TutorialModal onClose={() => setShowTutorial(false)} />
  );
};

export default TutorialWrapper;