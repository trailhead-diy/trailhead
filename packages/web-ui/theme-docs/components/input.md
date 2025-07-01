# Input Component Color Analysis

## Overview

The Input component has hardcoded colors for placeholder text and invalid states that need conversion to semantic tokens.

**🆕 Additional Analysis**: Found **8 new high priority issues** with icon colors, backgrounds, borders, and form states still using hardcoded colors.

## 🆕 New High Priority Issues (Line-Specific)

### 1. Icon Colors in InputGroup (Line 19)

```tsx
// Current - HARDCODED
'*:data-[slot=icon]:text-zinc-500 dark:*:data-[slot=icon]:text-zinc-400'

// Recommended Fix
'*:data-[slot=icon]:text-muted-foreground'
```

### 2. Background Pseudo-element (Line 53)

```tsx
// Current - HARDCODED
'before:bg-white'

// Recommended Fix
'before:bg-background'
```

### 3. Disabled State Background (Line 59)

```tsx
// Current - HARDCODED
'has-data-disabled:before:bg-zinc-950/5'

// Recommended Fix
'has-data-disabled:before:bg-muted/50'
```

### 4. Placeholder Text Color (Line 90)

```tsx
// Current - HARDCODED
'placeholder:text-zinc-500'

// Recommended Fix
'placeholder:text-muted-foreground'
```

### 5. Border Colors - Light Mode (Line 92)

```tsx
// Current - MIXED SEMANTIC/HARDCODED
'border border-zinc-950/10 data-hover:border-zinc-950/20'

// Recommended Fix
'border border-input data-hover:border-primary/50'
```

### 6. Background Color (Line 94)

```tsx
// Current - HARDCODED DARK MODE
'bg-transparent dark:bg-white/5'

// Recommended Fix
'bg-transparent dark:bg-muted'
```

### 7. Invalid State Border (Line 98)

```tsx
// Current - HARDCODED
'data-invalid:border-red-500'

// Recommended Fix
'data-invalid:border-destructive'
```

### 8. Disabled State Border (Line 100)

```tsx
// Current - HARDCODED
'data-disabled:border-zinc-950/20 dark:data-disabled:border-white/15'

// Recommended Fix
'data-disabled:border-muted-foreground/20'
```

## Complete Color Mappings

### Base Input

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

### Input with Icon

| Element           | Original Classes              | Semantic Token                        | Implementation        |
| ----------------- | ----------------------------- | ------------------------------------- | --------------------- |
| Icon color        | `text-zinc-500`               | `text-muted-foreground`               | ✅ Use semantic token |
| Icon color (dark) | `dark:text-zinc-400`          | `dark:text-muted-foreground`          | ✅ Use semantic token |
| Icon disabled     | `data-disabled:text-zinc-600` | `data-disabled:text-muted-foreground` | ✅ Use semantic token |

## Implementation Priority

1. **High**: Convert placeholder colors to semantic tokens
2. **High**: Fix invalid state colors to use destructive tokens
3. **Medium**: Update focus border and outline colors
4. **Medium**: Fix disabled state styling
5. **Low**: Ensure icon colors match the theme

## Special Considerations

- Input background should be slightly different from page background
- Focus states should be clearly visible
- Invalid states must use destructive color consistently
- Placeholder text needs sufficient contrast
- Icons should use muted colors to not distract from input content

## Testing Requirements

- Test all input types (text, email, password, etc.)
- Verify placeholder text visibility
- Test focus states with keyboard navigation
- Validate invalid state styling with form validation
- Check disabled state appearance
- Test with leading/trailing icons
- Ensure proper contrast ratios
