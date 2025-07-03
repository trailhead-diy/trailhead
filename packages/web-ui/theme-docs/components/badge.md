# Badge Component Color Analysis

## Overview

The Badge component uses a color variant system with 18 variants that **must be preserved**. Like Button, we should add semantic variants without removing the existing color-specific ones.

## Color Variant System

### Current Implementation

The Badge component has a `colors` object with variants for:

- `zinc` (default)
- `red`, `orange`, `amber`, `yellow`, `lime`
- `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`
- `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`

Each variant defines:

- Background color with opacity
- Text color
- Hover state background
- Dark mode specific colors

### Color Mapping Example

```javascript
// Current implementation
red: 'bg-red-500/15 text-red-700 group-data-hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:group-data-hover:bg-red-500/20';
```

### Recommended Enhancement

Add semantic token variants to the existing colors object:

```javascript
const colors = {
  // ... keep all existing color variants ...

  // Add semantic variants
  primary:
    'bg-primary/15 text-primary group-data-hover:bg-primary/25 dark:bg-primary/10 dark:text-primary dark:group-data-hover:bg-primary/20',
  secondary:
    'bg-secondary/15 text-secondary-foreground group-data-hover:bg-secondary/25 dark:bg-secondary/10 dark:text-secondary-foreground dark:group-data-hover:bg-secondary/20',
  accent:
    'bg-accent text-accent-foreground group-data-hover:bg-accent/80 dark:bg-accent dark:text-accent-foreground dark:group-data-hover:bg-accent/80',
  destructive:
    'bg-destructive/15 text-destructive group-data-hover:bg-destructive/25 dark:bg-destructive/10 dark:text-destructive dark:group-data-hover:bg-destructive/20',
  muted:
    'bg-muted text-muted-foreground group-data-hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground dark:group-data-hover:bg-muted/80',
};
```

## Badge Variants

### Badge (default)

Uses the color variant system directly.

### BadgeButton

| Element     | Original Classes              | Semantic Token               | Implementation        |
| ----------- | ----------------------------- | ---------------------------- | --------------------- |
| Focus ring  | `data-focus:outline-blue-500` | `data-focus:outline-primary` | ✅ Use semantic token |
| TouchTarget | Inherits from Badge           | Keep inheritance             | ✅ Correct            |

## Implementation Strategy

1. **Preserve all existing color variants** - Don't remove any of the 18 color options
2. **Add semantic variants** - Extend the colors object with theme-aware options
3. **Maintain consistency** - Ensure semantic variants follow the same opacity patterns
4. **Update focus states** - Use primary color for focus rings

## Special Considerations

- Badge colors use lower opacity (10-25%) for subtle appearance
- Hover states increase opacity slightly
- Text colors need sufficient contrast on semi-transparent backgrounds
- Dark mode uses different opacity values for better visibility

## Implementation Priority

1. **High**: Add semantic token variants to colors object
2. **Medium**: Update focus ring color in BadgeButton
3. **Low**: Document usage patterns for semantic vs color variants

## Testing Requirements

- Verify all 18 existing color variants still work
- Test new semantic variants
- Ensure hover states have visible change
- Test BadgeButton focus states
- Validate contrast ratios for accessibility
- Check appearance on different background colors
- Test in both light and dark modes
