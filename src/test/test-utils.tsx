import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorProvider } from '../contexts/ErrorContext';
import { ToastProvider } from '../contexts/ToastContext';
import { LibraryProvider } from '../contexts/LibraryContext';
import { AudioProvider } from '../contexts/AudioContext';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
      }),
    },
  },
}));

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <ErrorProvider>
        <ToastProvider>
          <AuthProvider>
            <AudioProvider>
              <LibraryProvider>
                {children}
              </LibraryProvider>
            </AudioProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockTrack = (overrides = {}) => ({
  id: 'test-track-1',
  user_id: 'test-user-1',
  name: 'Test Track',
  artist: 'Test Artist',
  url: 'https://example.com/test.mp3',
  category: 'production' as const,
  tags: ['test', 'mock'],
  bpm: 120,
  key: 'C',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  collection: 'Test Collection',
  primary_track_id: null,
  version_number: 1,
  version_name: null,
  variation_count: 0,
  userRating: null,
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  ...overrides,
});