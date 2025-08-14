import React from 'react';
import { X } from 'lucide-react';
import { FilterState } from './FilterBar';

interface ActiveFilterChipsProps {
  filter: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({ filter, onRemoveFilter, onClearAll }) => {
  const chips: { key: keyof FilterState; label: string }[] = [];

  // BPM Range
  if (filter.bpmRange.min !== null || filter.bpmRange.max !== null) {
    const min = filter.bpmRange.min || '?';
    const max = filter.bpmRange.max || '?';
    chips.push({ key: 'bpmRange', label: `BPM: ${min}-${max}` });
  }

  // Key
  if (filter.key !== 'all') {
    chips.push({ key: 'key', label: `Key: ${filter.key}` });
  }

  // Date Filter
  if (filter.dateFilter !== 'all') {
    const filterLabels = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      year: 'This Year',
      last30: 'Last 30 Days',
      last90: 'Last 90 Days',
      custom: 'Custom Range'
    };
    chips.push({ key: 'dateFilter', label: `Date: ${filterLabels[filter.dateFilter] || filter.dateFilter}` });
  }
  
  // Custom Date Range (when using custom filter)
  if (filter.dateFilter === 'custom' && (filter.dateRange.from || filter.dateRange.to)) {
    const from = filter.dateRange.from ? filter.dateRange.from.toLocaleDateString() : '?';
    const to = filter.dateRange.to ? filter.dateRange.to.toLocaleDateString() : '?';
    chips.push({ key: 'dateRange', label: `Custom: ${from} - ${to}` });
  }

  // Tags
  if (filter.tags.length > 0) {
    chips.push({ key: 'tags', label: `Tags: ${filter.tags.join(', ')}` });
  }

  // Rating
  if (filter.rating !== 'all') {
    chips.push({ key: 'rating', label: `Rating: ${filter.rating}` });
  }

  // Type
  if (filter.type !== 'all') {
    chips.push({ key: 'type', label: `Type: ${filter.type}` });
  }

  // Collection
  if (filter.collection !== 'all') {
    chips.push({ key: 'collection', label: `Album: ${filter.collection}` });
  }

  // Artist
  if (filter.artist !== 'all') {
    chips.push({ key: 'artist', label: `Artist: ${filter.artist}` });
  }

  // Primary Only
  if (filter.primaryOnly) {
    chips.push({ key: 'primaryOnly', label: 'Primary Only' });
  }

  if (chips.length === 0) return null;

  return (
    <div className="px-4 py-2 bg-forest-main/50 border-t border-forest-light">
      <div className="flex items-center space-x-2 flex-wrap">
        <span className="font-quicksand text-xs text-silver/60 uppercase tracking-wider">Active Filters:</span>
        {chips.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center space-x-1 bg-accent-yellow/20 text-accent-yellow rounded-full px-3 py-1"
          >
            <span className="font-quicksand text-xs">{label}</span>
            <button
              onClick={() => onRemoveFilter(key)}
              className="hover:text-accent-yellow/80 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={onClearAll}
          className="font-quicksand text-xs text-silver/60 hover:text-silver transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default ActiveFilterChips;