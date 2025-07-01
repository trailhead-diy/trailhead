# Checkbox Component Color Analysis

## Overview

The Checkbox component has **2 critical `$1` syntax errors** that need immediate fixing. It also uses a color variant system that should be preserved with semantic token additions.

## Critical Issues

### Invalid `$1` Syntax

Found in `catalyst-checkbox.tsx`:

| Location | Original                                                | Recommended Fix                                     |
| -------- | ------------------------------------------------------- | --------------------------------------------------- |
| Line 57  | `after:shadow-[inset_0_1px_--theme(--color-white/15%)]` | `after:shadow-[inset_0_1px_theme(colors.white/15)]` |
| Line 57  | `[--color-white/15%]` contains `$1` replacement         | Use proper opacity syntax `/15`                     |

## Color Variant System

The Checkbox component has a `colors` object with 23 variants that **must be preserved**:

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
    '[--checkbox-check:var(--color-primary-foreground)] [--checkbox-checked-bg:var(--primary)] [--checkbox-checked-border:var(--primary)]/90',
  secondary:
    '[--checkbox-check:var(--color-secondary-foreground)] [--checkbox-checked-bg:var(--secondary)] [--checkbox-checked-border:var(--secondary)]/90',
  accent:
    '[--checkbox-check:var(--color-accent-foreground)] [--checkbox-checked-bg:var(--accent)] [--checkbox-checked-border:var(--accent)]/90',
  destructive:
    '[--checkbox-check:var(--color-destructive-foreground)] [--checkbox-checked-bg:var(--destructive)] [--checkbox-checked-border:var(--destructive)]/90',
}
```

## Complete Color Mappings

### Light Mode

| Element           | Original Classes                         | Semantic Token                                   | Implementation        |
| ----------------- | ---------------------------------------- | ------------------------------------------------ | --------------------- |
| Background        | `before:bg-white`                        | `before:bg-background`                           | ✅ Use semantic token |
| Background (dark) | `dark:bg-white/5`                        | `dark:bg-muted/20`                               | ✅ Use semantic token |
| Border            | `border-zinc-950/15`                     | `border-foreground/15`                           | ✅ Use semantic token |
| Border (hover)    | `group-data-hover:border-zinc-950/30`    | `group-data-hover:border-foreground/30`          | ✅ Use semantic token |
| Disabled border   | `group-data-disabled:border-zinc-950/25` | `group-data-disabled:border-muted-foreground/25` | ✅ Use semantic token |
| Disabled bg       | `group-data-disabled:bg-zinc-950/5`      | `group-data-disabled:bg-muted/20`                | ✅ Use semantic token |
| Shadow            | `before:shadow-sm`                       | Keep as-is                                       | ✅ Correct            |
| Focus ring        | `group-data-focus:outline-blue-500`      | `group-data-focus:outline-primary`               | ✅ Use semantic token |

### Dark Mode

| Element         | Original Classes                           | Semantic Token                                        | Implementation        |
| --------------- | ------------------------------------------ | ----------------------------------------------------- | --------------------- |
| Border          | `dark:border-white/15`                     | `dark:border-foreground/15`                           | ✅ Use semantic token |
| Border (hover)  | `dark:group-data-hover:border-white/30`    | `dark:group-data-hover:border-foreground/30`          | ✅ Use semantic token |
| Disabled border | `dark:group-data-disabled:border-white/20` | `dark:group-data-disabled:border-muted-foreground/20` | ✅ Use semantic token |
| Disabled bg     | `dark:group-data-disabled:bg-white/2.5`    | `dark:group-data-disabled:bg-muted/10`                | ✅ Use semantic token |

## Implementation Priority

1. **Critical**: Fix the `$1` syntax errors immediately
2. **High**: Convert hardcoded colors to semantic tokens
3. **Medium**: Add semantic variants to the colors object while preserving existing variants

## Testing Requirements

- Verify checkbox renders correctly in all color variants
- Test hover and disabled states in both light and dark modes
- Ensure focus ring uses theme primary color
- Validate CSS parsing after fixing `$1` syntax
