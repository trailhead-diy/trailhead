# Table Component Color Analysis

## Overview

The Table component has **1 critical `$1` syntax error** and issues with row hover states that need semantic token conversion.

**🆕 Additional Analysis**: Found **6 new critical issues** affecting user interaction and visual feedback in table states.

## Critical Issues

### Invalid `$1` Syntax (Original Issue)

Found in `catalyst-table.tsx`:

| Location        | Original                       | Recommended Fix                    |
| --------------- | ------------------------------ | ---------------------------------- |
| Line (in hover) | Contains `$1` in opacity value | Replace with proper opacity syntax |

### 🆕 New Critical Issues (Line-Specific)

#### 1. Striped Row Backgrounds (Line 117)

```tsx
// Current - HARDCODED
striped && 'even:bg-zinc-950/2.5 dark:even:bg-white/2.5'

// Recommended Fix
striped && 'even:bg-muted/50 dark:even:bg-muted/25'
```

#### 2. Hover States on Striped Rows (Line 118)

```tsx
// Current - HARDCODED
href && striped && 'hover:bg-zinc-950/5 dark:hover:bg-white/5'

// Recommended Fix
href && striped && 'hover:bg-muted/75 dark:hover:bg-muted/50'
```

#### 3. Hover States on Non-Striped Rows (Line 119)

```tsx
// Current - HARDCODED
href && !striped && 'hover:bg-zinc-950/2.5 dark:hover:bg-white/2.5'

// Recommended Fix
href && !striped && 'hover:bg-muted/50 dark:hover:bg-muted/25'
```

#### 4. Grid Border Colors - TableCell (Line 135)

```tsx
// Current - HARDCODED
grid && 'border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5'

// Recommended Fix
grid && 'border-l border-l-border first:border-l-0'
```

#### 5. Border Colors - TableRow (Line 154)

```tsx
// Current - MIXED SEMANTIC/HARDCODED
!striped && 'border-b border-zinc-950/5 dark:border-border'

// Recommended Fix
!striped && 'border-b border-border'
```

#### 6. Grid Border Colors - TableRow (Line 155)

```tsx
// Current - HARDCODED
grid && 'border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5'

// Recommended Fix
grid && 'border-l border-l-border first:border-l-0'
```

### Impact Assessment

- **Critical**: Hover states don't respond to theme changes, breaking interaction feedback
- **Critical**: Striped tables become invisible or poorly contrasted in certain themes
- **High**: Grid borders may not align with theme color schemes

## Complete Color Mappings

### Table Container

| Element       | Original Classes       | Semantic Token       | Implementation        |
| ------------- | ---------------------- | -------------------- | --------------------- |
| Border        | `border-zinc-950/10`   | `border-border`      | ✅ Use semantic token |
| Border (dark) | `dark:border-white/10` | `dark:border-border` | ✅ Use semantic token |

### TableHead

| Element           | Original Classes         | Semantic Token         | Implementation        |
| ----------------- | ------------------------ | ---------------------- | --------------------- |
| Background        | `bg-zinc-50`             | `bg-muted/50`          | ✅ Use semantic token |
| Background (dark) | `dark:bg-zinc-900`       | `dark:bg-muted/50`     | ✅ Use semantic token |
| Border            | `border-b-zinc-950/10`   | `border-b-border`      | ✅ Use semantic token |
| Border (dark)     | `dark:border-b-white/10` | `dark:border-b-border` | ✅ Use semantic token |

### TableHeader

| Element     | Original Classes     | Semantic Token         | Implementation        |
| ----------- | -------------------- | ---------------------- | --------------------- |
| Text        | `text-zinc-900`      | `text-foreground`      | ✅ Use semantic token |
| Text (dark) | `dark:text-zinc-100` | `dark:text-foreground` | ✅ Use semantic token |
| Font weight | `font-semibold`      | Keep as-is             | ✅ Correct            |

### TableBody Row

| Element         | Original Classes          | Semantic Token         | Implementation        |
| --------------- | ------------------------- | ---------------------- | --------------------- |
| Hover bg        | `hover:bg-zinc-950/2.5`   | `hover:bg-accent`      | ✅ Use semantic token |
| Hover bg (dark) | `dark:hover:bg-white/2.5` | `dark:hover:bg-accent` | ✅ Use semantic token |
| Border          | `border-b-zinc-950/5`     | `border-b-border`      | ✅ Use semantic token |
| Border (dark)   | `dark:border-b-white/5`   | `dark:border-b-border` | ✅ Use semantic token |

### TableCell

| Element     | Original Classes  | Semantic Token         | Implementation                  |
| ----------- | ----------------- | ---------------------- | ------------------------------- |
| Text        | `text-zinc-950`   | `text-foreground`      | ✅ Use semantic token           |
| Text (dark) | `dark:text-white` | `dark:text-foreground` | ✅ Use semantic token           |
| Link text   | `text-zinc-950`   | `text-primary`         | ✅ Use semantic token for links |

## Special Table Patterns

### Striped Tables

| Element          | Original Classes           | Semantic Token          | Implementation        |
| ---------------- | -------------------------- | ----------------------- | --------------------- |
| Even rows        | `even:bg-zinc-50/50`       | `even:bg-muted/30`      | ✅ Use semantic token |
| Even rows (dark) | `dark:even:bg-zinc-900/50` | `dark:even:bg-muted/30` | ✅ Use semantic token |

### Grid Tables

| Element          | Original Classes         | Semantic Token     | Implementation        |
| ---------------- | ------------------------ | ------------------ | --------------------- |
| Vertical borders | `border-r-zinc-950/10`   | `border-r-border`  | ✅ Use semantic token |
| Cell borders     | Various border utilities | Use `border` token | ✅ Use semantic token |

## Implementation Priority

1. **Critical**: Fix the `$1` syntax error immediately
2. **High**: Convert row hover states (currently causing visual issues)
3. **High**: Update table header backgrounds
4. **Medium**: Ensure consistent border colors
5. **Low**: Update striped table patterns

## Testing Requirements

- Fix CSS parsing error from `$1` syntax
- Verify row hover states work smoothly
- Test striped and grid table variants
- Ensure proper contrast for readability
- Validate responsive behavior
- Check sticky header functionality if present
