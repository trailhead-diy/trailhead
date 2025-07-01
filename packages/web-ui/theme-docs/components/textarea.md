# Textarea Component Color Analysis

## Overview

The Textarea component shares the same styling as Input and has the same issues with placeholder and invalid state colors.

**🆕 High Priority Issue Found**: Textarea pseudo-element background uses hardcoded colors affecting theme consistency.

## 🆕 High Priority Issue (Line-Specific)

### Textarea Pseudo-element Background (Line 23)

```tsx
// Current - HARDCODED
'before:bg-white before:shadow-sm'

// Recommended Fix
'before:bg-background before:shadow-sm'
```

**Impact**: Textarea pseudo-elements may not match theme background colors, affecting visual consistency across themed environments.

## Complete Color Mappings

### Base Textarea

| Element            | Original Classes                 | Semantic Token                           | Implementation        |
| ------------------ | -------------------------------- | ---------------------------------------- | --------------------- |
| Background         | `bg-white`                       | `bg-background`                          | ✅ Use semantic token |
| Background (dark)  | `dark:bg-white/5`                | `dark:bg-muted/20`                       | ✅ Use semantic token |
| Border             | `border-zinc-950/10`             | `border-input`                           | ✅ Use semantic token |
| Border (dark)      | `dark:border-white/10`           | `dark:border-input`                      | ✅ Use semantic token |
| Text               | `text-zinc-950`                  | `text-foreground`                        | ✅ Use semantic token |
| Text (dark)        | `dark:text-white`                | `dark:text-foreground`                   | ✅ Use semantic token |
| Placeholder        | `placeholder:text-zinc-500`      | `placeholder:text-muted-foreground`      | ✅ Use semantic token |
| Placeholder (dark) | `dark:placeholder:text-zinc-400` | `dark:placeholder:text-muted-foreground` | ✅ Use semantic token |

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
| Text          | `data-invalid:text-red-600`        | `data-invalid:text-destructive`        | ✅ Use semantic token |
| Text (dark)   | `dark:data-invalid:text-red-400`   | `dark:data-invalid:text-destructive`   | ✅ Use semantic token |

### Disabled State

| Element           | Original Classes                   | Semantic Token                             | Implementation        |
| ----------------- | ---------------------------------- | ------------------------------------------ | --------------------- |
| Background        | `data-disabled:bg-zinc-950/5`      | `data-disabled:bg-muted`                   | ✅ Use semantic token |
| Background (dark) | `dark:data-disabled:bg-white/2.5`  | `dark:data-disabled:bg-muted`              | ✅ Use semantic token |
| Border            | `data-disabled:border-zinc-950/20` | `data-disabled:border-muted-foreground/20` | ✅ Use semantic token |
| Text              | `data-disabled:text-zinc-600`      | `data-disabled:text-muted-foreground`      | ✅ Use semantic token |

### Resize Handle

| Element         | Original Classes     | Semantic Token | Implementation |
| --------------- | -------------------- | -------------- | -------------- |
| Handle          | Browser default      | Keep default   | ✅ Correct     |
| Resize behavior | `resize-*` utilities | Keep as-is     | ✅ Correct     |

## Implementation Priority

1. **High**: Convert placeholder colors to semantic tokens
2. **High**: Fix invalid state colors to use destructive tokens
3. **Medium**: Update focus border and outline colors
4. **Medium**: Fix disabled state styling
5. **Low**: Consider custom resize handle styling

## Special Considerations

- Textarea should maintain consistency with Input component
- Resize handle visibility varies by browser
- Auto-resize functionality should be preserved
- Consider min/max height constraints

## Testing Requirements

- Test with various amounts of text
- Verify placeholder text visibility
- Test focus states with keyboard navigation
- Validate invalid state styling
- Check disabled state appearance
- Test resize functionality
- Ensure proper contrast ratios
- Test auto-resize if implemented
