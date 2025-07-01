# Select Component Color Analysis

## Overview

The Select component has multiple hardcoded colors for various states that need conversion to semantic tokens.

## Complete Color Mappings

### Base Select

| Element           | Original Classes       | Semantic Token         | Implementation        |
| ----------------- | ---------------------- | ---------------------- | --------------------- |
| Background        | `bg-white`             | `bg-background`        | ✅ Use semantic token |
| Background (dark) | `dark:bg-white/5`      | `dark:bg-muted/20`     | ✅ Use semantic token |
| Border            | `border-zinc-950/10`   | `border-input`         | ✅ Use semantic token |
| Border (dark)     | `dark:border-white/10` | `dark:border-input`    | ✅ Use semantic token |
| Text              | `text-zinc-950`        | `text-foreground`      | ✅ Use semantic token |
| Text (dark)       | `dark:text-white`      | `dark:text-foreground` | ✅ Use semantic token |

### Chevron Icon

| Element           | Original Classes     | Semantic Token               | Implementation        |
| ----------------- | -------------------- | ---------------------------- | --------------------- |
| Icon color        | `text-zinc-500`      | `text-muted-foreground`      | ✅ Use semantic token |
| Icon color (dark) | `dark:text-zinc-400` | `dark:text-muted-foreground` | ✅ Use semantic token |

### Focus State

| Element       | Original Classes                  | Semantic Token                      | Implementation        |
| ------------- | --------------------------------- | ----------------------------------- | --------------------- |
| Border        | `data-focus:border-zinc-950/20`   | `data-focus:border-primary/50`      | ✅ Use semantic token |
| Border (dark) | `dark:data-focus:border-white/20` | `dark:data-focus:border-primary/50` | ✅ Use semantic token |
| Outline       | `data-focus:outline-2`            | Keep as-is                          | ✅ Correct            |
| Outline color | `data-focus:outline-blue-500`     | `data-focus:outline-primary`        | ✅ Use semantic token |

### Invalid State

| Element       | Original Classes                   | Semantic Token                         | Implementation        |
| ------------- | ---------------------------------- | -------------------------------------- | --------------------- |
| Border        | `data-invalid:border-red-500`      | `data-invalid:border-destructive`      | ✅ Use semantic token |
| Border (dark) | `dark:data-invalid:border-red-500` | `dark:data-invalid:border-destructive` | ✅ Use semantic token |

### Disabled State

| Element           | Original Classes                   | Semantic Token                             | Implementation        |
| ----------------- | ---------------------------------- | ------------------------------------------ | --------------------- |
| Background        | `data-disabled:bg-zinc-950/5`      | `data-disabled:bg-muted`                   | ✅ Use semantic token |
| Background (dark) | `dark:data-disabled:bg-white/2.5`  | `dark:data-disabled:bg-muted`              | ✅ Use semantic token |
| Border            | `data-disabled:border-zinc-950/20` | `data-disabled:border-muted-foreground/20` | ✅ Use semantic token |
| Text              | `data-disabled:text-zinc-600`      | `data-disabled:text-muted-foreground`      | ✅ Use semantic token |

### Option Elements

| Element     | Original Classes      | Semantic Token   | Implementation |
| ----------- | --------------------- | ---------------- | -------------- |
| Option bg   | Native select styling | Browser default  | ✅ Keep native |
| Option text | Inherits from select  | Keep inheritance | ✅ Correct     |

## Implementation Priority

1. **High**: Convert all hardcoded colors to semantic tokens
2. **High**: Fix invalid state to use destructive color
3. **Medium**: Update focus states to use primary color
4. **Medium**: Ensure chevron icon uses muted colors
5. **Low**: Test native option styling across browsers

## Special Considerations

- Select uses native browser dropdown on mobile
- Custom styling is limited for option elements
- Chevron icon should be subtle but visible
- Focus states must be clearly visible
- Consider custom dropdown implementation for full theming control

## Testing Requirements

- Test in different browsers (Chrome, Firefox, Safari)
- Verify mobile select behavior
- Test focus states with keyboard navigation
- Validate invalid state styling
- Check disabled state appearance
- Test with long option text
- Ensure proper contrast ratios
