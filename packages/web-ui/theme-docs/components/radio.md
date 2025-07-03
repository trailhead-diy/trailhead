# Radio Component Color Analysis

## Overview

The Radio component has **2 critical `$1` syntax errors** that need immediate fixing. Like Checkbox, it uses a color variant system that should be preserved with semantic token additions.

## Critical Issues

### Invalid `$1` Syntax

Found in `catalyst-radio.tsx`:

| Location | Original                                                | Recommended Fix                                     |
| -------- | ------------------------------------------------------- | --------------------------------------------------- |
| Line 57  | `after:shadow-[inset_0_1px_--theme(--color-white/15%)]` | `after:shadow-[inset_0_1px_theme(colors.white/15)]` |
| Line 57  | `[--color-white/15%]` contains `$1` replacement         | Use proper opacity syntax `/15`                     |

## Color Variant System

The Radio component has a `colors` object with 23 variants that **must be preserved**:

```javascript
const colors = {
  'dark/zinc': [...],
  'dark/white': [...],
  white: [...],
  dark: [...],
  zinc: [...],
  red: [...],
  orange: [...],
  amber: [...],
  yellow: [...],
  lime: [...],
  green: [...],
  emerald: [...],
  teal: [...],
  cyan: [...],
  sky: [...],
  blue: [...],
  indigo: [...],
  violet: [...],
  purple: [...],
  fuchsia: [...],
  pink: [...],
  rose: [...]
}
```

### Recommended Enhancement

Add semantic token variants to the existing colors object:

```javascript
const colors = {
  // ... existing color variants ...

  // Add semantic variants
  primary:
    '[--radio-checked-bg:var(--primary)] [--radio-checked-border:var(--primary)]/90 [--radio-checked-indicator:var(--primary-foreground)]',
  secondary:
    '[--radio-checked-bg:var(--secondary)] [--radio-checked-border:var(--secondary)]/90 [--radio-checked-indicator:var(--secondary-foreground)]',
  accent:
    '[--radio-checked-bg:var(--accent)] [--radio-checked-border:var(--accent)]/90 [--radio-checked-indicator:var(--accent-foreground)]',
  destructive:
    '[--radio-checked-bg:var(--destructive)] [--radio-checked-border:var(--destructive)]/90 [--radio-checked-indicator:var(--destructive-foreground)]',
};
```

## Complete Color Mappings

### Light Mode

| Element            | Original Classes                                                           | Semantic Token                                                               | Implementation        |
| ------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------- |
| Background         | `before:bg-white`                                                          | `before:bg-background`                                                       | ✅ Use semantic token |
| Background (dark)  | `dark:bg-white/5`                                                          | `dark:bg-muted/20`                                                           | ✅ Use semantic token |
| Border             | `border-zinc-950/15`                                                       | `border-foreground/15`                                                       | ✅ Use semantic token |
| Border (hover)     | `group-data-hover:border-zinc-950/30`                                      | `group-data-hover:border-foreground/30`                                      | ✅ Use semantic token |
| Indicator (hover)  | `group-data-hover:[--radio-indicator:var(--color-zinc-900)]/10`            | `group-data-hover:[--radio-indicator:var(--foreground)]/10`                  | ✅ Use semantic token |
| Disabled border    | `group-data-disabled:border-zinc-950/25`                                   | `group-data-disabled:border-muted-foreground/25`                             | ✅ Use semantic token |
| Disabled bg        | `group-data-disabled:bg-zinc-950/5`                                        | `group-data-disabled:bg-muted/20`                                            | ✅ Use semantic token |
| Disabled indicator | `group-data-disabled:[--radio-checked-indicator:var(--color-zinc-950)]/50` | `group-data-disabled:[--radio-checked-indicator:var(--muted-foreground)]/50` | ✅ Use semantic token |
| Shadow             | `before:shadow-sm`                                                         | Keep as-is                                                                   | ✅ Correct            |
| Focus ring         | `group-data-focus:outline-blue-500`                                        | `group-data-focus:outline-primary`                                           | ✅ Use semantic token |

### Dark Mode

| Element            | Original Classes                                                             | Semantic Token                                                              | Implementation        |
| ------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------- |
| Border             | `dark:border-white/15`                                                       | `dark:border-foreground/15`                                                 | ✅ Use semantic token |
| Border (hover)     | `dark:group-data-hover:border-white/30`                                      | `dark:group-data-hover:border-foreground/30`                                | ✅ Use semantic token |
| Indicator (hover)  | `dark:group-data-hover:[--radio-indicator:var(--color-zinc-700)]`            | `dark:group-data-hover:[--radio-indicator:var(--muted-foreground)]`         | ✅ Use semantic token |
| Disabled border    | `dark:group-data-disabled:border-white/20`                                   | `dark:group-data-disabled:border-muted-foreground/20`                       | ✅ Use semantic token |
| Disabled bg        | `dark:group-data-disabled:bg-white/2.5`                                      | `dark:group-data-disabled:bg-muted/10`                                      | ✅ Use semantic token |
| Disabled indicator | `dark:group-data-disabled:[--radio-checked-indicator:var(--color-white)]/50` | `dark:group-data-disabled:[--radio-checked-indicator:var(--foreground)]/50` | ✅ Use semantic token |

## Implementation Priority

1. **Critical**: Fix the `$1` syntax errors immediately
2. **High**: Convert hardcoded colors to semantic tokens
3. **Medium**: Add semantic variants to the colors object while preserving existing variants

## Testing Requirements

- Verify radio button renders correctly in all color variants
- Test hover and disabled states in both light and dark modes
- Ensure focus ring uses theme primary color
- Validate CSS parsing after fixing `$1` syntax
- Test indicator color changes on hover
