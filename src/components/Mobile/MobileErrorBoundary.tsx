import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class MobileErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mobile error boundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCache = async () => {
    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      // Unregister service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-forest-dark flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <h1 className="font-anton text-2xl text-accent-coral mb-4">Oops! Something went wrong</h1>
            <p className="font-quicksand text-silver/80 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-3 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium"
              >
                Reload App
              </button>
              <button
                onClick={this.handleClearCache}
                className="w-full px-4 py-3 bg-forest-light text-silver rounded-lg font-quicksand font-medium"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MobileErrorBoundary;