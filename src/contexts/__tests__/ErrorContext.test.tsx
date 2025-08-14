import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ErrorProvider, useError } from '../ErrorContext';
import { ToastProvider } from '../ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <ErrorProvider>{children}</ErrorProvider>
  </ToastProvider>
);

describe('ErrorContext', () => {
  it('provides error context', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    expect(result.current.errors).toEqual([]);
    expect(typeof result.current.addError).toBe('function');
    expect(typeof result.current.removeError).toBe('function');
    expect(typeof result.current.clearErrors).toBe('function');
    expect(typeof result.current.handleError).toBe('function');
  });

  it('adds errors', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.addError({
        message: 'Test error',
        severity: 'error',
      });
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      message: 'Test error',
      severity: 'error',
      timestamp: expect.any(Date),
    });
  });

  it('removes errors', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    let errorId: string;
    
    act(() => {
      result.current.addError({
        message: 'Test error',
        severity: 'error',
      });
      errorId = result.current.errors[0].id;
    });

    expect(result.current.errors).toHaveLength(1);

    act(() => {
      result.current.removeError(errorId!);
    });

    expect(result.current.errors).toHaveLength(0);
  });

  it('clears all errors', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.addError({ message: 'Error 1' });
      result.current.addError({ message: 'Error 2' });
      result.current.addError({ message: 'Error 3' });
    });

    expect(result.current.errors).toHaveLength(3);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toHaveLength(0);
  });

  it('handles different error types', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      // Error object
      result.current.handleError(new Error('Test error'));
      
      // String error
      result.current.handleError('String error');
      
      // Unknown error
      result.current.handleError({ some: 'object' });
    });

    expect(result.current.errors).toHaveLength(3);
    expect(result.current.errors[0].message).toBe('Test error');
    expect(result.current.errors[1].message).toBe('String error');
    expect(result.current.errors[2].message).toBe('An unexpected error occurred');
  });

  it('categorizes network errors', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.handleError(new Error('network error occurred'));
    });

    expect(result.current.errors[0]).toMatchObject({
      message: 'Network error. Please check your connection.',
      severity: 'warning',
    });
  });

  it('categorizes permission errors', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.handleError(new Error('permission denied'));
    });

    expect(result.current.errors[0]).toMatchObject({
      message: "You don't have permission to perform this action.",
      severity: 'error',
    });
  });

  it('emits custom events for non-critical errors', () => {
    const eventListener = vi.fn();
    window.addEventListener('app-error', eventListener);

    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.addError({
        message: 'Test warning',
        severity: 'warning',
      });
    });

    expect(eventListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          message: 'Test warning',
          type: 'error', // warnings map to error type for toast
        },
      })
    );

    window.removeEventListener('app-error', eventListener);
  });

  it('does not emit events for critical errors', () => {
    const eventListener = vi.fn();
    window.addEventListener('app-error', eventListener);

    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.addError({
        message: 'Critical error',
        severity: 'critical',
      });
    });

    expect(eventListener).not.toHaveBeenCalled();

    window.removeEventListener('app-error', eventListener);
  });
});