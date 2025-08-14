# CoreTet Testing Guide

## Overview

CoreTet uses Vitest as its testing framework, along with React Testing Library for component testing.

## Running Tests

```bash
# Run all tests once
npm test -- --run

# Run tests in watch mode
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage
```

## Test Structure

Tests are located alongside the components they test in `__tests__` directories:

```
src/
  components/
    Library/
      FilterBar.tsx
      __tests__/
        FilterBar.test.tsx
  contexts/
    ErrorContext.tsx
    __tests__/
      ErrorContext.test.tsx
  utils/
    retryHelper.ts
    __tests__/
      retryHelper.test.ts
```

## Writing Tests

### Component Tests

Use the custom render function from `test-utils.tsx` which includes all necessary providers:

```typescript
import { render, screen } from '@/test/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Hook Tests

Use `renderHook` from React Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.doSomething();
    });
    
    expect(result.current.value).toBe('expected');
  });
});
```

### Mocking

#### Mocking Supabase

Supabase is automatically mocked in `test-utils.tsx`. You can override specific methods in your tests:

```typescript
import { vi } from 'vitest';
import { supabase } from '@/lib/supabase';

vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: mockData, error: null })
  })
});
```

#### Mocking Components

```typescript
vi.mock('../SomeComponent', () => ({
  default: () => <div>Mocked Component</div>
}));
```

## Test Utilities

### Mock Data Factories

Use the provided factories to create test data:

```typescript
import { createMockTrack, createMockUser } from '@/test/test-utils';

const mockTrack = createMockTrack({
  name: 'Custom Track Name',
  bpm: 140
});

const mockUser = createMockUser({
  email: 'test@example.com'
});
```

### Common Patterns

#### Testing Error States

```typescript
it('handles errors gracefully', async () => {
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockRejectedValue(new Error('Network error'))
  });

  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

#### Testing Loading States

```typescript
it('shows loading state', async () => {
  render(<MyComponent />);
  
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
```

#### Testing User Interactions

```typescript
it('handles user input', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  
  render(<MyForm onSubmit={onSubmit} />);
  
  await user.type(screen.getByRole('textbox'), 'test input');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(onSubmit).toHaveBeenCalledWith('test input');
});
```

## Coverage

Run `npm test:coverage` to generate a coverage report. The report will be available in the `coverage` directory.

Aim for:
- 80% statement coverage
- 70% branch coverage
- 80% function coverage
- 80% line coverage

## Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep tests isolated**: Each test should be independent and not rely on others
4. **Mock external dependencies**: Mock API calls, timers, and other external dependencies
5. **Test edge cases**: Include tests for error states, loading states, and empty states
6. **Use descriptive test names**: Test names should clearly describe what is being tested