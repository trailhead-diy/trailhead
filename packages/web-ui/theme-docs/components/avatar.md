# Avatar Component Color Analysis

## Overview

The Avatar component has outline colors that need conversion to semantic tokens.

## Complete Color Mappings

### Avatar Container

| Element    | Original Classes         | Semantic Token | Implementation |
| ---------- | ------------------------ | -------------- | -------------- |
| Background | Various (image/initials) | Keep as-is     | ✅ Correct     |
| Size       | `size-*` utilities       | Keep as-is     | ✅ Correct     |

### Avatar with Outline

| Element        | Original Classes     | Semantic Token           | Implementation        |
| -------------- | -------------------- | ------------------------ | --------------------- |
| Outline        | `ring-4 ring-white`  | `ring-4 ring-background` | ✅ Use semantic token |
| Outline (dark) | `dark:ring-zinc-900` | `dark:ring-background`   | ✅ Use semantic token |

### Avatar with Initials

| Element           | Original Classes     | Semantic Token                 | Implementation        |
| ----------------- | -------------------- | ------------------------------ | --------------------- |
| Background        | `bg-zinc-900`        | `bg-primary`                   | ✅ Use semantic token |
| Background (dark) | `dark:bg-white`      | `dark:bg-primary`              | ✅ Use semantic token |
| Text              | `text-white`         | `text-primary-foreground`      | ✅ Use semantic token |
| Text (dark)       | `dark:text-zinc-900` | `dark:text-primary-foreground` | ✅ Use semantic token |

### Avatar Group

| Element             | Original Classes     | Semantic Token           | Implementation        |
| ------------------- | -------------------- | ------------------------ | --------------------- |
| Overlap ring        | `ring-2 ring-white`  | `ring-2 ring-background` | ✅ Use semantic token |
| Overlap ring (dark) | `dark:ring-zinc-900` | `dark:ring-background`   | ✅ Use semantic token |

## Implementation Priority

1. **High**: Convert outline rings to use background color
2. **Medium**: Update initials background to use primary color
3. **Low**: Ensure proper stacking in avatar groups

## Special Considerations

- Avatar outlines should match the page background for seamless appearance
- Initials avatars should use primary color for brand consistency
- Avatar groups need proper spacing and overlap handling
- Consider adding more color options for initials avatars

## Testing Requirements

- Test with various image sizes
- Verify initials display correctly
- Test avatar groups with different counts
- Ensure outline appears correctly on different backgrounds
- Validate in both light and dark modes
