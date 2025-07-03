# Semantic Colors Migration Guide

## Overview

This guide explains the semantic color system added to Trailhead UI components and how to migrate from hardcoded colors to semantic tokens.

## Important Note on Color Preservation

**Current Status**: The transform system is designed to convert zinc/neutral colors to semantic tokens throughout the codebase. However, if you want to preserve ALL existing colors (including brand colors like red, blue, indigo, etc.) exactly as they are, you should use the `--skip-transforms` flag:

```bash
# Get fresh Catalyst components without ANY transformations
trailhead-ui transforms --skip-transforms
```

This will copy the original Catalyst UI components with all their original colors intact, without applying any transformations.

## What Changed

### 1. New Semantic Color Definitions

All components with color props now support semantic color tokens in addition to their existing color options:

- `primary` - Primary brand color for main actions and focus states
- `secondary` - Secondary brand color for less prominent elements
- `destructive` - Destructive/danger color for delete actions and errors
- `accent` - Accent color for highlights and hover states
- `muted` - Muted color for subtle backgrounds and disabled states

### 2. Updated Default Colors

Components that previously defaulted to neutral colors now default to semantic tokens:

| Component | Old Default | New Default |
| --------- | ----------- | ----------- |
| Button    | `dark/zinc` | `primary`   |
| Badge     | `zinc`      | `primary`   |
| Checkbox  | `dark/zinc` | `primary`   |
| Radio     | `dark/zinc` | `primary`   |
| Switch    | `dark/zinc` | `primary`   |

### 3. Transform System Behavior

The transform system has two modes:

#### Full Transform Mode (default)

Applies all transformations including:

- Converting zinc/neutral colors to semantic tokens
- Adding semantic color definitions
- Updating default colors
- Transforming CSS variables (e.g., `var(--color-white)` → `var(--color-background)`)

```bash
# Run full transformations
trailhead-ui transforms
```

#### Skip Transforms Mode

Copies Catalyst components without any modifications:

- Preserves ALL original colors (zinc, white, brand colors)
- No semantic tokens are added
- No color transformations are applied

```bash
# Copy components without transformations
trailhead-ui transforms --skip-transforms
```

## Migration Strategies

### Strategy 1: Full Semantic Migration (Recommended)

Use the default transform mode to get components with semantic tokens:

```bash
trailhead-ui transforms
```

This approach:

- ✅ Provides theme-aware components
- ✅ Supports light/dark mode automatically
- ✅ Allows easy theme customization
- ⚠️ Transforms zinc colors throughout (including in brand color definitions)

### Strategy 2: Preserve Original Colors

Use skip transforms to keep original Catalyst colors:

```bash
trailhead-ui transforms --skip-transforms
```

Then manually add semantic color definitions to components you want to update:

```tsx
// Manually add to Button component's colors object
const colors = {
  // ... existing colors remain unchanged
  primary: '[--btn-bg:var(--color-primary)] [--btn-border:var(--color-primary)] ...',
  secondary: '[--btn-bg:var(--color-secondary)] [--btn-border:var(--color-secondary)] ...',
  // etc.
};
```

This approach:

- ✅ Preserves exact original styling
- ✅ Gives you full control over changes
- ⚠️ Requires manual work
- ⚠️ No automatic theme integration

### Strategy 3: Hybrid Approach

1. Start with `--skip-transforms` to get original components
2. Selectively apply transforms to specific components
3. Manually adjust as needed

## Component-Specific Patterns

### Button

```tsx
// Semantic colors follow the same solid pattern as brand colors
<Button color="primary">Primary Action</Button>
<Button color="secondary">Secondary Action</Button>
<Button color="destructive">Delete</Button>
```

### Badge

```tsx
// Semantic colors use subtle backgrounds with appropriate text colors
<Badge color="primary">New</Badge>
<Badge color="secondary">Info</Badge>
<Badge color="destructive">Error</Badge>
<Badge color="accent">Featured</Badge>
<Badge color="muted">Archived</Badge>
```

### Form Controls (Checkbox, Radio, Switch)

```tsx
// All form controls use primary by default for checked states
<Checkbox color="primary" />
<Radio color="primary" />
<Switch color="primary" />

// Use other semantic colors for specific contexts
<Checkbox color="destructive" /> // For dangerous options
<Switch color="accent" /> // For feature toggles
```

## Backward Compatibility

All existing color options remain supported:

- Brand colors: `indigo`, `blue`, `green`, `red`, etc.
- Neutral colors: `zinc`, `slate`, `gray`, etc.
- Special variants: `dark/zinc`, `light`, `dark/white`, etc.

The semantic colors are additive - they don't replace existing colors.

## Best Practices

1. **Use semantic tokens for common UI patterns**:
   - `primary` for main CTAs and primary actions
   - `secondary` for secondary actions
   - `destructive` for delete/remove actions
   - `accent` for highlights and hover states
   - `muted` for disabled or archived content

2. **Keep brand colors for specific branding needs**:
   - Use `indigo`, `purple`, etc. when you need a specific brand color
   - Semantic tokens should map to your brand colors in your theme

3. **Let components use their defaults**:
   - Don't specify `color="primary"` explicitly - it's the default
   - Only override when you need a different semantic meaning

## Troubleshooting

### Components showing transformed colors when you want originals

Use the `--skip-transforms` flag to get untransformed components:

```bash
trailhead-ui transforms --skip-transforms
```

### Want semantic colors without zinc transformations

Currently, the transform system applies all transformations together. If you need semantic colors without zinc transformations:

1. Use `--skip-transforms` to get original components
2. Manually add the semantic color definitions you need
3. Or create custom transforms for your specific needs

### Old components still using zinc defaults

Run the transforms without `--skip-transforms` to update components:

```bash
trailhead-ui transforms
```

## Technical Details

### Color Transformation Behavior

When transforms are applied, the system:

1. Converts zinc color classes to semantic tokens (e.g., `bg-zinc-950` → `bg-foreground`)
2. Transforms CSS variables (e.g., `var(--color-white)` → `var(--color-background)`)
3. Adds semantic color definitions to component color objects
4. Updates default colors to use semantic tokens

This transformation is comprehensive and affects all color references, including those within brand color definitions. For example:

```tsx
// Original
red: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-red-600)]';

// After transformation
red: '[--checkbox-check:var(--color-background)] [--checkbox-checked-bg:var(--color-red-600)]';
```

If you need the exact original colors, use `--skip-transforms`.

## Summary

The semantic color system provides a more maintainable and theme-aware approach to component styling. You have two main options:

1. **Full transformation** (default): Get fully theme-integrated components with zinc colors converted to semantic tokens
2. **Skip transforms**: Preserve all original colors exactly as they are in Catalyst UI

Choose the approach that best fits your project's needs.
