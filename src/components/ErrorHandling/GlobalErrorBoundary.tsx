import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { errorLogger } from '../../services/errorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
    
    // Log to error tracking service (if configured)
    this.logErrorToService(error, errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Log to error service
    errorLogger.log(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'GlobalErrorBoundary'
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-forest-dark flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-forest-main rounded-lg shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-accent-coral" />
              <h1 className="text-2xl font-anton text-silver">
                Something went wrong
              </h1>
            </div>

            <p className="text-silver/80 mb-6">
              We encountered an unexpected error. The issue has been logged and we'll look into it.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-accent-yellow/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center space-x-2 px-4 py-2 bg-forest-light text-silver rounded-lg hover:bg-forest-light/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center space-x-2 px-4 py-2 bg-forest-light text-silver rounded-lg hover:bg-forest-light/80 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            </div>

            {/* Error details for development */}
            {isDevelopment && this.state.error && (
              <details className="bg-forest-dark rounded-lg p-4">
                <summary className="cursor-pointer text-silver/60 hover:text-silver">
                  Error Details (Development Only)
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-accent-yellow text-sm font-semibold mb-2">
                      Error Message:
                    </h3>
                    <pre className="text-silver/80 text-xs overflow-x-auto whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                  </div>
                  
                  {this.state.error.stack && (
                    <div>
                      <h3 className="text-accent-yellow text-sm font-semibold mb-2">
                        Stack Trace:
                      </h3>
                      <pre className="text-silver/80 text-xs overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h3 className="text-accent-yellow text-sm font-semibold mb-2">
                        Component Stack:
                      </h3>
                      <pre className="text-silver/80 text-xs overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Error frequency warning */}
            {this.state.errorCount > 2 && (
              <div className="mt-4 p-3 bg-accent-coral/10 border border-accent-coral/30 rounded-lg">
                <p className="text-accent-coral text-sm">
                  This error has occurred {this.state.errorCount} times. 
                  You may want to refresh the page or clear your browser cache.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}