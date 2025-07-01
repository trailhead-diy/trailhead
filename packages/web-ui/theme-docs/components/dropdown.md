# Dropdown Component Color Analysis

## Overview

The Dropdown component has **1 critical `$1` syntax error** and several hardcoded colors that need conversion to semantic tokens.

## Critical Issues

### Invalid `$1` Syntax

Found in `catalyst-dropdown.tsx`:

| Location         | Original                                         | Recommended Fix                               |
| ---------------- | ------------------------------------------------ | --------------------------------------------- |
| Line (in shadow) | `shadow-[inset_0_1px_--theme(--color-white/$1)]` | `shadow-[inset_0_1px_theme(colors.white/15)]` |

## Complete Color Mappings

### DropdownButton

Uses the Button component styles - see Button documentation for color variants.

### Dropdown Panel

| Element           | Original Classes       | Semantic Token       | Implementation        |
| ----------------- | ---------------------- | -------------------- | --------------------- |
| Background        | `bg-white`             | `bg-popover`         | ✅ Use semantic token |
| Background (dark) | `dark:bg-zinc-900`     | `dark:bg-popover`    | ✅ Use semantic token |
| Border            | `border-zinc-950/10`   | `border-border`      | ✅ Use semantic token |
| Border (dark)     | `dark:border-white/10` | `dark:border-border` | ✅ Use semantic token |
| Shadow            | `shadow-lg`            | Keep as-is           | ✅ Correct            |
| Ring              | `ring-zinc-950/10`     | `ring-border`        | ✅ Use semantic token |
| Ring (dark)       | `dark:ring-white/10`   | `dark:ring-border`   | ✅ Use semantic token |

### DropdownItem

| Element                 | Original Classes              | Semantic Token                        | Implementation        |
| ----------------------- | ----------------------------- | ------------------------------------- | --------------------- |
| Text                    | `text-zinc-950`               | `text-popover-foreground`             | ✅ Use semantic token |
| Text (dark)             | `dark:text-white`             | `dark:text-popover-foreground`        | ✅ Use semantic token |
| Text (disabled)         | `data-disabled:text-zinc-500` | `data-disabled:text-muted-foreground` | ✅ Use semantic token |
| Background (hover)      | `data-hover:bg-zinc-950/5`    | `data-hover:bg-accent`                | ✅ Use semantic token |
| Background (hover dark) | `dark:data-hover:bg-white/5`  | `dark:data-hover:bg-accent`           | ✅ Use semantic token |
| Background (focus)      | `data-focus:bg-zinc-950/5`    | `data-focus:bg-accent`                | ✅ Use semantic token |
| Background (focus dark) | `dark:data-focus:bg-white/5`  | `dark:data-focus:bg-accent`           | ✅ Use semantic token |

### DropdownLabel

| Element     | Original Classes     | Semantic Token               | Implementation        |
| ----------- | -------------------- | ---------------------------- | --------------------- |
| Text        | `text-zinc-500`      | `text-muted-foreground`      | ✅ Use semantic token |
| Text (dark) | `dark:text-zinc-400` | `dark:text-muted-foreground` | ✅ Use semantic token |

### DropdownDivider

| Element       | Original Classes       | Semantic Token       | Implementation        |
| ------------- | ---------------------- | -------------------- | --------------------- |
| Border        | `border-zinc-950/10`   | `border-border`      | ✅ Use semantic token |
| Border (dark) | `dark:border-white/10` | `dark:border-border` | ✅ Use semantic token |

## Implementation Priority

1. **Critical**: Fix the `$1` syntax error immediately
2. **High**: Convert dropdown panel colors to popover tokens
3. **High**: Update item hover/focus states
4. **Medium**: Ensure consistent disabled state styling

## Special Considerations

- Dropdown should use `popover` semantic tokens for better theme consistency
- Ensure proper contrast between dropdown and page background
- Test keyboard navigation highlighting
- Verify shadow rendering in all themes

## Testing Requirements

- Fix CSS parsing error from `$1` syntax
- Verify dropdown opens without visual glitches
- Test hover and focus states
- Ensure proper contrast in all themes
- Validate keyboard navigation
- Check nested dropdowns if supported
