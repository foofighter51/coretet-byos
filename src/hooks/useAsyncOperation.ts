import { useState, useCallback } from 'react';
import { useError } from '../contexts/ErrorContext';
import { withRetry, isRetryableError } from '../utils/retryHelper';

interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: boolean;
  retryAttempts?: number;
  showErrorToast?: boolean;
}

export function useAsyncOperation<T = unknown>(options: UseAsyncOperationOptions<T> = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { handleError } = useError();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    operationName?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      let result: T;

      if (options.retry && isRetryableError(error)) {
        result = await withRetry(operation, {
          maxAttempts: options.retryAttempts || 3,
          onRetry: (attempt, err) => {
            // Retrying operation
          }
        });
      } else {
        result = await operation();
      }

      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (options.showErrorToast !== false) {
        handleError(error, { operation: operationName });
      }
      
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options, handleError]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset
  };
}