import { describe, it, expect, vi } from 'vitest';
import { withRetry, retryNetworkRequest, isRetryableError } from '../retryHelper';

describe('retryHelper', () => {
  describe('withRetry', () => {
    it('returns successful result immediately', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure up to maxAttempts', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn, { maxAttempts: 3, delay: 10 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('throws error after maxAttempts', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(
        withRetry(mockFn, { maxAttempts: 2, delay: 10 })
      ).rejects.toThrow('Always fails');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('calls onRetry callback', async () => {
      const onRetry = vi.fn();
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      await withRetry(mockFn, { 
        maxAttempts: 2, 
        delay: 10,
        onRetry 
      });
      
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('uses exponential backoff when enabled', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn((fn: () => void, delay?: number) => {
        delays.push(delay || 0);
        fn();
        return 1 as unknown as NodeJS.Timeout;
      });

      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      await withRetry(mockFn, { 
        maxAttempts: 3, 
        delay: 100,
        backoff: true 
      });
      
      expect(delays).toEqual([100, 200]); // 100ms, then 200ms (exponential)
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('isRetryableError', () => {
    it('identifies network errors as retryable', () => {
      expect(isRetryableError(new Error('network error'))).toBe(true);
      expect(isRetryableError(new Error('fetch failed'))).toBe(true);
      expect(isRetryableError({ code: 'NETWORK_ERROR' })).toBe(true);
    });

    it('identifies timeout errors as retryable', () => {
      expect(isRetryableError({ name: 'TimeoutError' })).toBe(true);
      expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
    });

    it('identifies server errors as retryable', () => {
      expect(isRetryableError({ status: 500 })).toBe(true);
      expect(isRetryableError({ status: 502 })).toBe(true);
      expect(isRetryableError({ status: 503 })).toBe(true);
    });

    it('identifies rate limiting as retryable', () => {
      expect(isRetryableError({ status: 429 })).toBe(true);
    });

    it('identifies non-retryable errors', () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
      expect(isRetryableError({ status: 401 })).toBe(false);
      expect(isRetryableError({ status: 404 })).toBe(false);
      expect(isRetryableError(new Error('validation error'))).toBe(false);
    });
  });

  describe('retryNetworkRequest', () => {
    it('uses network-specific defaults', async () => {
      const mockRequest = vi.fn().mockResolvedValue('data');
      
      const result = await retryNetworkRequest(mockRequest);
      
      expect(result).toBe('data');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('logs retry attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const mockRequest = vi.fn()
        .mockRejectedValueOnce(new Error('Network failed'))
        .mockResolvedValue('data');
      
      await retryNetworkRequest(mockRequest, { delay: 10 });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Network request failed, attempt 1:',
        'Network failed'
      );
      
      consoleSpy.mockRestore();
    });
  });
});