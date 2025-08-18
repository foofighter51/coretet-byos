import React, { useEffect } from 'react';

export function GoogleOAuthCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (window.opener) {
      if (error) {
        window.opener.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: error
        }, window.location.origin);
      } else if (code) {
        window.opener.postMessage({
          type: 'GOOGLE_OAUTH_SUCCESS',
          code: code
        }, window.location.origin);
      }
      // Close popup after short delay to ensure message is sent
      setTimeout(() => {
        window.close();
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-forest-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-silver font-quicksand">Completing Google Drive connection...</p>
      </div>
    </div>
  );
}