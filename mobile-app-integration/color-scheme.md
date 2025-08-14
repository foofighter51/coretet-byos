# CoreTet Color Scheme & Design System

## Color Palette

### Primary Colors
```css
/* Forest Theme - Dark Green Palette */
--forest-dark: #0F1F0F;     /* Main dark background */
--forest-main: #1A2F1A;     /* Primary background */
--forest-light: #2D4A2D;    /* Lighter backgrounds, hover states */

/* Text Colors */
--silver: #E8E8E8;          /* Primary text */
--silver-muted: #E8E8E8CC;  /* 80% opacity - muted text */
--silver-dim: #E8E8E899;    /* 60% opacity - dim text */

/* Accent Colors */
--accent-yellow: #FFD700;   /* Primary accent - highlights, active states */
--accent-coral: #FF6B6B;    /* Delete buttons, warnings, errors */
```

### Usage Examples

#### Backgrounds
```css
/* Main app background */
background-color: var(--forest-main);

/* Darker sections (panels, modals) */
background-color: var(--forest-dark);

/* Hover states */
background-color: var(--forest-light);

/* Subtle containers */
background-color: rgba(26, 47, 26, 0.5); /* forest-main/50 */
```

#### Text
```css
/* Primary text */
color: var(--silver);

/* Muted text (descriptions, secondary info) */
color: var(--silver-muted);

/* Dim text (timestamps, metadata) */
color: var(--silver-dim);

/* Headers and important labels */
color: var(--accent-yellow);
```

#### Borders
```css
/* Default border */
border: 1px solid var(--forest-light);

/* Subtle border */
border: 1px solid rgba(45, 74, 45, 0.3); /* forest-light/30 */

/* Active/Focus border */
border: 1px solid var(--accent-yellow);

/* Accent panel border */
border: 1px solid rgba(255, 215, 0, 0.3); /* accent-yellow/30 */
```

#### Interactive Elements
```css
/* Default button */
background-color: var(--forest-light);
color: var(--silver);

/* Primary action button */
background-color: var(--accent-yellow);
color: var(--forest-dark);

/* Hover states */
background-color: rgba(45, 74, 45, 0.8); /* forest-light/80 */

/* Active/Selected state */
background-color: rgba(255, 215, 0, 0.2); /* accent-yellow/20 */
color: var(--accent-yellow);

/* Delete/Danger button */
background-color: var(--accent-coral);
color: var(--silver);
```

## Component-Specific Styles

### Filter Panel
```css
/* Panel background */
background-color: var(--forest-dark);
border: 1px solid rgba(255, 215, 0, 0.3);

/* Section containers */
background-color: rgba(26, 47, 26, 0.5);
border: 1px solid rgba(45, 74, 45, 0.3);

/* Active filters */
background-color: var(--accent-yellow);
color: var(--forest-dark);

/* Inactive tags */
background-color: var(--forest-dark);
color: var(--silver);
border: 1px solid rgba(45, 74, 45, 0.5);
```

### Track Cards
```css
/* Default state */
background-color: var(--forest-light);
border: 1px solid transparent;

/* Hover state */
background-color: rgba(45, 74, 45, 0.8);
border: 1px solid var(--accent-yellow);

/* Selected state */
background-color: rgba(255, 215, 0, 0.1);
border: 2px solid var(--accent-yellow);
```

### Input Fields
```css
/* Default input */
background-color: var(--forest-dark);
border: 1px solid rgba(45, 74, 45, 0.5);
color: var(--silver);

/* Focus state */
border-color: var(--accent-yellow);

/* Placeholder text */
color: rgba(232, 232, 232, 0.4); /* silver/40 */
```

## Mobile Considerations

### Touch Targets
- Minimum 44x44px for all interactive elements
- Add extra padding for mobile buttons
- Increase spacing between clickable items

### Contrast Ratios
- Yellow on dark green: 9.5:1 (AAA compliant)
- Silver on forest-main: 8.7:1 (AAA compliant)
- Silver on forest-dark: 10.2:1 (AAA compliant)

### Dark Mode
The app is designed as dark-mode first. For a potential light mode:
- Invert the green scale
- Use dark gray instead of silver for text
- Maintain yellow as accent but adjust for contrast

## Implementation for React Native

```jsx
// colors.ts
export const colors = {
  forest: {
    dark: '#0F1F0F',
    main: '#1A2F1A',
    light: '#2D4A2D',
  },
  text: {
    primary: '#E8E8E8',
    muted: '#E8E8E8CC',
    dim: '#E8E8E899',
  },
  accent: {
    yellow: '#FFD700',
    coral: '#FF6B6B',
  },
  transparent: {
    forestMain50: 'rgba(26, 47, 26, 0.5)',
    forestLight30: 'rgba(45, 74, 45, 0.3)',
    yellow20: 'rgba(255, 215, 0, 0.2)',
    yellow30: 'rgba(255, 215, 0, 0.3)',
  },
};

// Example usage in React Native
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.forest.main,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: colors.accent.yellow,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: colors.forest.dark,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Typography

### Font Stack
- **Headers**: 'Anton', sans-serif (or system bold for mobile)
- **Body**: 'Quicksand', sans-serif (or system default for mobile)

### Font Sizes
- **Headers**: 20-24px
- **Body**: 14-16px
- **Small text**: 12px
- **Tiny text**: 10px

### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700