import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar, { type FilterState } from '../FilterBar';

const mockFilters: FilterState = {
  bpmRange: { min: null, max: null },
  key: 'all',
  dateFilter: 'all',
  dateRange: { from: null, to: null },
  tags: [],
  rating: 'all',
  type: 'all',
  collection: 'all',
  artist: 'all',
  primaryOnly: false,
};

const mockCollections = ['Collection 1', 'Collection 2'];
const mockArtists = ['Artist 1', 'Artist 2'];
const mockAvailableTags = ['tag1', 'tag2', 'tag3'];

describe('FilterBar', () => {
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('renders all filter controls', () => {
    render(
      <FilterBar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    // Check for main filter elements
    expect(screen.getByPlaceholderText('Min')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max')).toBeInTheDocument();
    expect(screen.getByText('All Keys')).toBeInTheDocument();
    expect(screen.getByText('All Dates')).toBeInTheDocument();
    expect(screen.getByText('All Ratings')).toBeInTheDocument();
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('All Collections')).toBeInTheDocument();
    expect(screen.getByText('All Artists')).toBeInTheDocument();
  });

  it('updates BPM range filter', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterBar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    const minInput = screen.getByPlaceholderText('Min');
    await user.type(minInput, '120');

    expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        bpmRange: { min: 120, max: null },
      })
    );
  });

  it('updates key filter', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterBar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    await user.click(screen.getByText('All Keys'));
    await user.click(screen.getByText('C Major'));

    expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        key: 'C',
      })
    );
  });

  it('updates date filter', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterBar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    await user.click(screen.getByText('All Dates'));
    await user.click(screen.getByText('Last 30 Days'));

    expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dateFilter: 'last30',
      })
    );
  });

  it('toggles primary only filter', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterBar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        primaryOnly: true,
      })
    );
  });

  it('saves and loads filter presets', async () => {
    const user = userEvent.setup();
    localStorage.clear();
    
    render(
      <FilterBar
        filters={{
          ...mockFilters,
          bpmRange: { min: 120, max: 140 },
          key: 'C',
        }}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    // Save preset
    await user.click(screen.getByRole('button', { name: /save preset/i }));
    await user.type(screen.getByPlaceholderText('Enter preset name'), 'My Preset');
    await user.click(screen.getByText('Save'));

    // Check localStorage
    const saved = JSON.parse(localStorage.getItem('coretet-filter-presets') || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('My Preset');
    expect(saved[0].filters.bpmRange).toEqual({ min: 120, max: 140 });
  });

  it('loads saved presets', async () => {
    const user = userEvent.setup();
    
    // Set up a preset in localStorage
    const preset = {
      id: '1',
      name: 'Test Preset',
      filters: {
        ...mockFilters,
        rating: 'loved' as const,
      },
    };
    localStorage.setItem('coretet-filter-presets', JSON.stringify([preset]));

    render(
      <FilterBar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    // Open presets dropdown
    await user.click(screen.getByRole('button', { name: /presets/i }));
    
    // Click on preset
    await user.click(screen.getByText('Test Preset'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith(preset.filters);
  });

  it('resets all filters', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterBar
        filters={{
          ...mockFilters,
          bpmRange: { min: 120, max: 140 },
          key: 'C',
          tags: ['tag1'],
          primaryOnly: true,
        }}
        onFiltersChange={mockOnFiltersChange}
        collections={mockCollections}
        artists={mockArtists}
        availableTags={mockAvailableTags}
      />
    );

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(mockOnFiltersChange).toHaveBeenCalledWith(mockFilters);
  });
});