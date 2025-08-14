import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalErrorBoundary } from '../GlobalErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('GlobalErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when error is thrown', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = import.meta.env.DEV;
    import.meta.env.DEV = true;

    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

    import.meta.env.DEV = originalEnv;
  });

  it('allows retrying after error', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    const { rerender } = render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click retry
    await user.click(screen.getByText('Try Again'));

    // Re-render with fixed condition
    rerender(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('allows page reload', async () => {
    const user = userEvent.setup();
    const reloadMock = vi.fn();
    Object.defineProperty(window.location, 'reload', {
      value: reloadMock,
      writable: true,
    });

    render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    await user.click(screen.getByText('Reload Page'));
    expect(reloadMock).toHaveBeenCalled();
  });

  it('shows error frequency warning after multiple errors', () => {
    const { rerender } = render(
      <GlobalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    // Trigger error multiple times
    for (let i = 0; i < 3; i++) {
      rerender(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );
    }

    expect(screen.getByText(/This error has occurred 3 times/)).toBeInTheDocument();
  });
});