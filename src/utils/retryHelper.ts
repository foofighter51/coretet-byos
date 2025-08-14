interface RetryableError {
  message?: string;
  code?: string;
  name?: string;
  status?: number;
  [key: string]: unknown;
}

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: RetryableError) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: RetryableError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      // Call retry callback
      onRetry?.(attempt, error);

      // Calculate delay with exponential backoff
      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

// Specialized retry for network requests
export async function retryNetworkRequest<T>(
  request: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(request, {
    maxAttempts: 3,
    delay: 1000,
    backoff: true,
    onRetry: (_attempt, _error) => {
      // Network request retry attempt
    },
    ...options
  });
}

// Check if error is retryable
export function isRetryableError(error: RetryableError): boolean {
  // Network errors
  if (error.message?.includes('network') || 
      error.message?.includes('fetch') ||
      error.code === 'NETWORK_ERROR') {
    return true;
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // Rate limiting (429)
  if (error.status === 429) {
    return true;
  }

  return false;
}