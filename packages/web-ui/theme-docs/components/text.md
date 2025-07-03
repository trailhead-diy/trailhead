# Text Component Color Analysis

## Overview

The Text component has **1 critical `$1` syntax error** and uses color props that need semantic token mapping.

**🆕 High Priority Issue Found**: Text link decoration colors use hardcoded values affecting theme consistency.

## Critical Issues

### Invalid `$1` Syntax (Original Issue)

Found in `catalyst-text.tsx`:

| Location            | Original                                | Recommended Fix            |
| ------------------- | --------------------------------------- | -------------------------- |
| Line (in className) | Contains `$1` in opacity or color value | Replace with proper syntax |

### 🆕 New High Priority Issue (Line-Specific)

#### Text Link Decoration Colors (Line 33)

```tsx
// Current - HARDCODED
'decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:decoration-white/50 dark:data-hover:decoration-white';

// Recommended Fix
'decoration-muted-foreground data-hover:decoration-foreground dark:decoration-muted-foreground dark:data-hover:decoration-foreground';
```

**Impact**: Link decorations don't adapt to theme colors, affecting text link consistency across themed environments.

## Complete Color Mappings

### Base Text Colors

The Text component uses a color prop system that should map to semantic tokens:

| Color Prop | Original Classes                   | Semantic Token             | Implementation        |
| ---------- | ---------------------------------- | -------------------------- | --------------------- |
| Default    | `text-zinc-950 dark:text-white`    | `text-foreground`          | ✅ Use semantic token |
| `muted`    | `text-zinc-600 dark:text-zinc-400` | `text-muted-foreground`    | ✅ Use semantic token |
| `dim`      | `text-zinc-500 dark:text-zinc-500` | `text-muted-foreground/80` | ✅ Use semantic token |
| `light`    | `text-zinc-400 dark:text-zinc-600` | `text-muted-foreground/60` | ✅ Use semantic token |

### Strong Element

| Element     | Original Classes                | Semantic Token    | Implementation        |
| ----------- | ------------------------------- | ----------------- | --------------------- |
| Strong      | `text-zinc-950 dark:text-white` | `text-foreground` | ✅ Use semantic token |
| Font weight | `font-medium`                   | Keep as-is        | ✅ Correct            |

### Code Element

| Element           | Original Classes     | Semantic Token   | Implementation        |
| ----------------- | -------------------- | ---------------- | --------------------- |
| Background        | `bg-zinc-950/5`      | `bg-muted`       | ✅ Use semantic token |
| Background (dark) | `dark:bg-white/5`    | `dark:bg-muted`  | ✅ Use semantic token |
| Text              | Inherits from parent | Keep inheritance | ✅ Correct            |
| Border            | `rounded`            | Keep as-is       | ✅ Correct            |
| Padding           | `px-1 py-0.5`        | Keep as-is       | ✅ Correct            |

## Implementation Strategy

### Current Color System

```javascript
const colors = {
  default: 'text-zinc-950 dark:text-white',
  muted: 'text-zinc-600 dark:text-zinc-400',
  dim: 'text-zinc-500 dark:text-zinc-500',
  light: 'text-zinc-400 dark:text-zinc-600',
};
```

### Recommended Semantic System

```javascript
const colors = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  dim: 'text-muted-foreground/80',
  light: 'text-muted-foreground/60',
  // Add semantic options
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  destructive: 'text-destructive',
};
```

## Implementation Priority

1. **Critical**: Fix the `$1` syntax error immediately
2. **High**: Convert default text colors to semantic tokens
3. **Medium**: Add semantic color options to the color prop
4. **Low**: Ensure code blocks use proper muted backgrounds

## Testing Requirements

- Fix CSS parsing error from `$1` syntax
- Verify all text color variants render correctly
- Test strong and code elements
- Ensure proper contrast ratios
- Validate in both light and dark modes
- Check text readability on various backgrounds
