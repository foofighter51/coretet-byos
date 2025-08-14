import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useError } from '../../contexts/ErrorContext';
import { errorLogger } from '../../services/errorLogger';

export function ErrorDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showStoredErrors, setShowStoredErrors] = useState(false);
  const { errors, removeError, clearErrors } = useError();
  const storedErrors = errorLogger.getStoredErrors();

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  // Don't show if no errors
  if (errors.length === 0 && storedErrors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-red-900/90 border border-red-700 rounded-lg shadow-lg hover:bg-red-800/90 transition-colors"
      >
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-red-200">
          {errors.length} Error{errors.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Error panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 max-h-[600px] bg-forest-dark border border-forest-light rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-forest-light">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-anton text-silver">Error Debug Panel</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-forest-light rounded transition-colors"
              >
                <X className="w-4 h-4 text-silver/60" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {/* Current errors */}
            {errors.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-silver">Current Errors</h4>
                  <button
                    onClick={clearErrors}
                    className="flex items-center space-x-1 text-xs text-silver/60 hover:text-silver"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className={`p-3 rounded-lg border ${
                        error.severity === 'critical'
                          ? 'bg-red-900/20 border-red-700'
                          : error.severity === 'error'
                          ? 'bg-red-900/10 border-red-800'
                          : error.severity === 'warning'
                          ? 'bg-yellow-900/10 border-yellow-800'
                          : 'bg-blue-900/10 border-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-silver">{error.message}</p>
                          <p className="text-xs text-silver/60 mt-1">
                            {error.timestamp.toLocaleTimeString()}
                          </p>
                          {error.context && (
                            <details className="mt-2">
                              <summary className="text-xs text-silver/60 cursor-pointer">
                                Context
                              </summary>
                              <pre className="text-xs text-silver/40 mt-1 overflow-x-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        <button
                          onClick={() => removeError(error.id)}
                          className="ml-2 p-1 hover:bg-forest-light rounded transition-colors"
                        >
                          <X className="w-3 h-3 text-silver/60" />
                        </button>
                      </div>
                      {error.retry && (
                        <button
                          onClick={error.retry}
                          className="mt-2 text-xs px-2 py-1 bg-accent-yellow text-forest-dark rounded hover:bg-accent-yellow/90"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stored errors */}
            <div className="p-4 border-t border-forest-light">
              <button
                onClick={() => setShowStoredErrors(!showStoredErrors)}
                className="flex items-center justify-between w-full text-sm font-semibold text-silver hover:text-silver/80"
              >
                <span>Stored Error Logs ({storedErrors.length})</span>
                {showStoredErrors ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showStoredErrors && storedErrors.length > 0 && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => {
                      errorLogger.clearStoredErrors();
                      setShowStoredErrors(false);
                    }}
                    className="text-xs text-silver/60 hover:text-silver"
                  >
                    Clear Stored Logs
                  </button>
                  {storedErrors.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-forest-light/50 rounded-lg"
                    >
                      <p className="text-xs text-silver">{log.message}</p>
                      <p className="text-xs text-silver/60 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-silver/60 cursor-pointer">
                            Stack Trace
                          </summary>
                          <pre className="text-xs text-silver/40 mt-1 overflow-x-auto whitespace-pre-wrap">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}