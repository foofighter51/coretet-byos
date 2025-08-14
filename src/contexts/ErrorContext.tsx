import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { errorLogger } from '../services/errorLogger';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  retry?: () => void;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Partial<AppError>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  handleError: (error: unknown, context?: Record<string, any>) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: Partial<AppError>) => {
    const newError: AppError = {
      id: `error-${Date.now()}-${Math.random()}`,
      message: error.message || 'An unexpected error occurred',
      severity: error.severity || 'error',
      timestamp: new Date(),
      context: error.context,
      retry: error.retry
    };

    setErrors(prev => [...prev, newError]);

    // Emit custom event for toasts (will be handled by a listener)
    if (newError.severity !== 'critical') {
      const toastType = newError.severity === 'error' ? 'error' : 
                       newError.severity === 'warning' ? 'error' : 'info';
      
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: { message: newError.message, type: toastType }
      }));
    }

    // Log error
    console.error(`[${newError.severity.toUpperCase()}]`, newError.message, newError.context);
    
    // Log critical errors to error service
    if (newError.severity === 'error' || newError.severity === 'critical') {
      errorLogger.log(new Error(newError.message), newError.context);
    }

    return newError.id;
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleError = useCallback((error: unknown, context?: Record<string, any>) => {
    let message = 'An unexpected error occurred';
    let severity: ErrorSeverity = 'error';

    if (error instanceof Error) {
      message = error.message;
      
      // Categorize common errors
      if (error.message.includes('network') || error.message.includes('fetch')) {
        severity = 'warning';
        message = 'Network error. Please check your connection.';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        severity = 'error';
        message = 'You don\'t have permission to perform this action.';
      } else if (error.message.includes('not found')) {
        severity = 'warning';
        message = 'The requested resource was not found.';
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    addError({ message, severity, context });
  }, [addError]);

  return (
    <ErrorContext.Provider value={{
      errors,
      addError,
      removeError,
      clearErrors,
      handleError
    }}>
      {children}
    </ErrorContext.Provider>
  );
}