import React from 'react';

interface MobileLoadingScreenProps {
  message?: string;
  subMessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

const MobileLoadingScreen: React.FC<MobileLoadingScreenProps> = ({
  message = 'Loading...',
  subMessage,
  showRetry = false,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-forest-dark flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="font-anton text-4xl text-accent-yellow mb-2">CORETET</h1>
          <p className="font-quicksand text-silver/60 text-sm">Your music, organized</p>
        </div>

        {/* Loading animation */}
        <div className="mb-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-3 border-forest-light rounded-full"></div>
            <div className="absolute inset-0 border-3 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="font-quicksand text-silver">{message}</p>
          {subMessage && (
            <p className="font-quicksand text-silver/60 text-sm">{subMessage}</p>
          )}
        </div>

        {/* Retry button */}
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-6 py-3 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium active:scale-95 transition-transform"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileLoadingScreen;