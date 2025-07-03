# Switch Component Color Analysis

## Overview

The Switch component uses a color variant system with 23 variants that **must be preserved**. It also has hardcoded thumb background colors that need conversion.

## Color Variant System

### Current Implementation

The Switch component has a `colors` object with variants for:

- `dark/zinc`, `dark/white` (dual mode variants)
- `dark`, `zinc`, `white` (base variants)
- `red`, `orange`, `amber`, `yellow`, `lime` (color variants)
- `green`, `emerald`, `teal`, `cyan`, `sky`, `blue` (color variants)
- `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose` (color variants)

Each variant uses CSS custom properties:

- `--switch-bg`: Switch track background when checked
- `--switch-bg-ring`: Switch track border when checked
- `--switch`: Switch thumb color when checked
- `--switch-ring`: Switch thumb border
- `--switch-shadow`: Switch thumb shadow color

### Recommended Enhancement

Add semantic token variants to the existing colors object:

```javascript
const colors = {
  // ... keep all existing color variants ...

  // Add semantic variants
  primary: [
    '[--switch-bg-ring:var(--primary)]/90 [--switch-bg:var(--primary)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--primary-foreground)] [--switch-ring:var(--primary)]/90 [--switch-shadow:var(--primary)]/20',
  ],
  secondary: [
    '[--switch-bg-ring:var(--secondary)]/90 [--switch-bg:var(--secondary)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--secondary-foreground)] [--switch-ring:var(--secondary)]/90 [--switch-shadow:var(--secondary)]/20',
  ],
  accent: [
    '[--switch-bg-ring:var(--accent)]/90 [--switch-bg:var(--accent)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--accent-foreground)] [--switch-ring:var(--accent)]/90 [--switch-shadow:var(--accent)]/20',
  ],
  destructive: [
    '[--switch-bg-ring:var(--destructive)]/90 [--switch-bg:var(--destructive)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--destructive-foreground)] [--switch-ring:var(--destructive)]/90 [--switch-shadow:var(--destructive)]/20',
  ],
};
```

## Switch State Colors

### Unchecked State

| Element           | Original Classes     | Semantic Token     | Implementation        |
| ----------------- | -------------------- | ------------------ | --------------------- |
| Track bg          | `bg-zinc-200`        | `bg-muted`         | ✅ Use semantic token |
| Track bg (dark)   | `dark:bg-white/5`    | `dark:bg-muted`    | ✅ Use semantic token |
| Track ring        | `ring-black/5`       | `ring-border`      | ✅ Use semantic token |
| Track ring (dark) | `dark:ring-white/15` | `dark:ring-border` | ✅ Use semantic token |

### Switch Thumb

| Element      | Original Classes | Semantic Token    | Implementation        |
| ------------ | ---------------- | ----------------- | --------------------- |
| Thumb bg     | `bg-white`       | Keep for contrast | ⚠️ Special case       |
| Thumb shadow | `shadow-sm`      | Keep as-is        | ✅ Correct            |
| Thumb ring   | `ring-black/5`   | `ring-border`     | ✅ Use semantic token |

### Focus State

| Element    | Original Classes              | Semantic Token               | Implementation        |
| ---------- | ----------------------------- | ---------------------------- | --------------------- |
| Focus ring | `data-focus:outline-blue-500` | `data-focus:outline-primary` | ✅ Use semantic token |

### Disabled State

| Element         | Original Classes                 | Semantic Token                | Implementation        |
| --------------- | -------------------------------- | ----------------------------- | --------------------- |
| Track bg        | `data-disabled:bg-zinc-200`      | `data-disabled:bg-muted`      | ✅ Use semantic token |
| Track bg (dark) | `dark:data-disabled:bg-white/15` | `dark:data-disabled:bg-muted` | ✅ Use semantic token |

## Implementation Priority

1. **High**: Add semantic token variants to colors object
2. **High**: Convert unchecked state backgrounds to semantic tokens
3. **Medium**: Update focus ring to use primary color
4. **Medium**: Fix disabled state colors
5. **Low**: Keep thumb white for proper contrast

## Special Considerations

- The thumb should generally stay white/light for contrast
- Track colors change based on checked state
- Smooth transitions are important for switch animation
- Dark mode handling is complex with transparent overlays

## Testing Requirements

- Verify all 23 existing color variants still work
- Test new semantic variants
- Ensure smooth animation between states
- Test focus ring visibility
- Validate disabled state appearance
- Check contrast between thumb and track
- Test in both light and dark modes
