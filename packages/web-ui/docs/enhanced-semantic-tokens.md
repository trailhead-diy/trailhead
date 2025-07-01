# Enhanced Semantic Token System

## Overview

The Enhanced Semantic Token System preserves Catalyst UI's careful visual hierarchy while providing the benefits of semantic theming. This system addresses the critical issue where transforms were flattening different zinc shades that create important visual distinctions.

## The Problem We Solved

### Before: Visual Hierarchy Loss

```typescript
// Original Catalyst: Clear visual distinction
'[--btn-icon:var(--color-zinc-500)]' // Inactive state
'data-active:[--btn-icon:var(--color-zinc-700)]' // Active state

// Previous Transform: Visual hierarchy lost
'[--btn-icon:var(--color-muted-foreground)]' // Both states flattened!
'data-active:[--btn-icon:var(--color-muted-foreground)]'
```

### After: Hierarchy Preserved

```typescript
// Enhanced Transform: Visual distinction maintained
'[--btn-icon:var(--color-icon-inactive)]' // Clear inactive state
'data-active:[--btn-icon:var(--color-icon-active)]' // Clear active state
```

## Token Categories

### 1. Hierarchical Text Tokens

Preserves the 5-level text hierarchy from original Catalyst:

```typescript
export type HierarchicalTextToken =
  | 'text-primary' // zinc-950/zinc-50 - Highest contrast
  | 'text-secondary' // zinc-700/zinc-300 - Medium-high contrast
  | 'text-tertiary' // zinc-600/zinc-400 - Medium contrast
  | 'text-quaternary' // zinc-500/zinc-500 - Lower contrast
  | 'text-muted' // zinc-400/zinc-600 - Lowest contrast
```

**Usage Examples:**

- **Headers/Titles**: `text-primary`
- **Body text**: `text-secondary`
- **Supporting text**: `text-tertiary`
- **Metadata**: `text-quaternary`
- **Placeholders**: `text-muted`

### 2. Icon State Tokens

Preserves active/inactive/hover icon states:

```typescript
export type IconSemanticToken =
  | 'icon-primary' // Primary action icons
  | 'icon-secondary' // Secondary action icons
  | 'icon-inactive' // Default/rest state (zinc-500 equivalent)
  | 'icon-active' // Active/selected state (zinc-700 equivalent)
  | 'icon-hover' // Hover state icons
  | 'icon-muted' // Decorative/low-priority icons
```

**Usage Examples:**

- **Button icons**: `icon-inactive` → `icon-active` on interaction
- **Navigation icons**: `icon-secondary` → `icon-active` when selected
- **Decorative icons**: `icon-muted`

### 3. Border Weight Tokens

Preserves opacity-based border hierarchy:

```typescript
export type BorderSemanticToken =
  | 'border-strong' // High contrast borders (zinc-950 solid)
  | 'border-medium' // Standard borders (zinc-950/20)
  | 'border-subtle' // Low contrast borders (zinc-950/10)
  | 'border-ghost' // Very subtle borders (zinc-950/5)
```

**Usage Examples:**

- **Table headers**: `border-subtle` for gentle separation
- **Card outlines**: `border-medium` for clear definition
- **Focus rings**: `border-strong` for accessibility
- **Section dividers**: `border-ghost` for subtle organization

### 4. Component-Specific Tokens

Specialized tokens for complex components:

```typescript
export type ComponentSemanticToken =
  | 'sidebar-text-primary' // Main navigation text
  | 'sidebar-text-secondary' // Secondary navigation text
  | 'sidebar-icon-default' // Default sidebar icons
  | 'sidebar-icon-active' // Active sidebar icons
  | 'table-header-text' // Table header text
  | 'table-body-text' // Table body text
  | 'button-text-default' // Default button text
  | 'button-text-hover' // Hover button text
```

## Progressive Enhancement Theme System

### Base shadcn/ui Compatibility

All themes include the required shadcn/ui variables:

- `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`
- Plus chart colors, sidebar colors, and card colors

### Optional Enhanced Variables

Themes can optionally include enhanced variables for richer visual hierarchy:

- Hierarchical text tokens (`tertiary-foreground`, `quaternary-foreground`)
- Icon state tokens (`icon-inactive`, `icon-active`, `icon-hover`)
- Border weight tokens (`border-strong`, `border-subtle`, `border-ghost`)
- Component-specific tokens (sidebar, table, button variants)

### Smart Fallback System

Components use fallback chains for enhanced variables:

```css
color: var(--icon-inactive, var(--muted-foreground));
```

If the enhanced variable isn't defined, it falls back to a shadcn variable.

## Component Fallback Implementation

Components use inline fallback chains for enhanced variables:

```tsx
// Button icon states with fallbacks
'[--btn-icon:var(--icon-inactive,var(--muted-foreground))]'
'data-active:[--btn-icon:var(--icon-active,var(--primary))]'
'data-hover:[--btn-icon:var(--icon-hover,var(--primary-foreground))]'
```

**Benefits:**

- **Works with any shadcn theme** out of the box
- **Progressive enhancement** when enhanced vars are provided
- **No runtime overhead** - CSS handles fallbacks natively

## Theme Presets

### Catalyst Theme (1:1 Parity)

```typescript
import { themePresets } from '@trailhead/web-ui'

const catalystTheme = themePresets.catalyst()
```

Includes all enhanced variables for perfect visual match with original Catalyst UI.

### Color Themes

```typescript
const redTheme = themePresets.red()
const blueTheme = themePresets.blue()
const greenTheme = themePresets.green()
```

Base color themes with shadcn variables. Add enhanced variables as needed.

## Transform System Enhancements

### Enhanced Button Transforms

```typescript
// Before: Flattened states
zinc-500 → muted-foreground
zinc-700 → muted-foreground  // Same as above!

// After: Preserved states
zinc-500 → icon-inactive     // Clear semantic meaning
zinc-700 → icon-active       // Distinct from inactive
```

### Enhanced Text Transforms

```typescript
// Before: Lost hierarchy
zinc-950 → foreground
zinc-700 → foreground        // Same level!
zinc-500 → muted-foreground

// After: Preserved hierarchy
zinc-950 → foreground        // Highest contrast
zinc-700 → secondary-foreground  // Medium-high contrast
zinc-500 → quaternary-foreground // Lower contrast
```

### Enhanced Border Transforms

```typescript
// Before: Lost opacity information
zinc-950/10 → border         // Opacity lost!
zinc-950/5  → border         // Same as above!

// After: Preserved opacity intent
zinc-950/10 → border-subtle  // Preserves "subtle" intent
zinc-950/5  → border-ghost   // Preserves "very subtle" intent
```

## Component-Specific Enhancements

### Dropdown Component

- **Focus states**: Proper `data-focus` color preservation
- **Icon hierarchy**: `stroke-icon-inactive` → `stroke-icon-active`
- **Text hierarchy**: 5-level text distinction maintained

### Sidebar Component

- **Navigation states**: `sidebar-icon-default` → `sidebar-icon-active`
- **Text hierarchy**: `sidebar-text-primary` vs `sidebar-text-secondary`
- **Interaction feedback**: Proper hover/active/focus state colors

### Table Component

- **Header distinction**: `table-header-text` vs `table-body-text`
- **Border hierarchy**: `border-ghost` for column separators
- **Row hierarchy**: Different text levels for data importance

## Migration Guide

### From Basic shadcn/ui

```typescript
// Works immediately - no changes needed!
import { themePresets } from '@trailhead/web-ui'

// Use any preset or your existing shadcn theme
const theme = themePresets.blue() // or your existing theme
```

### From Original Catalyst

```typescript
// Use the Catalyst preset for perfect 1:1 parity
import { themePresets } from '@trailhead/web-ui'

const catalystTheme = themePresets.catalyst()
// All visual hierarchy preserved automatically
```

### Adding Enhanced Variables

```typescript
// Extend any theme with enhanced variables
const myTheme = {
  ...themePresets.blue(),
  light: {
    ...themePresets.blue().light,
    'icon-inactive': 'oklch(0.5 0.01 200)',
    'icon-active': 'oklch(0.7 0.15 200)',
  },
  dark: {
    ...themePresets.blue().dark,
    'icon-inactive': 'oklch(0.4 0.01 200)',
    'icon-active': 'oklch(0.8 0.15 200)',
  },
}
```

## Development Best Practices

### 1. Choose the Right Token Level

```typescript
// ✅ Good: Specific semantic meaning
className = 'text-table-header-text'

// ✅ Good: Clear hierarchy level
className = 'text-secondary-foreground'

// ❌ Avoid: Generic tokens when specific ones exist
className = 'text-foreground' // Too generic for table headers
```

### 2. Preserve State Distinctions

```typescript
// ✅ Good: Clear state progression
className = 'stroke-icon-inactive data-hover:stroke-icon-hover data-active:stroke-icon-active'

// ❌ Avoid: Flattened states
className = 'stroke-muted-foreground data-hover:stroke-muted-foreground' // No distinction!
```

### 3. Use Component-Specific Tokens

```typescript
// ✅ Good: Component-specific semantics
<SidebarItem className="text-sidebar-text-primary" />

// ✅ Good: Fallback to general tokens
<div className="text-secondary-foreground" />

// ❌ Avoid: Hardcoded colors
<div className="text-zinc-700" /> // Use semantic tokens instead
```

## Performance Considerations

### CSS Variable Optimization

The enhanced system uses CSS variables efficiently:

- **No runtime overhead**: Variables resolved at CSS level
- **Efficient fallbacks**: Minimal cascade impact
- **Tree-shakable**: Unused tokens don't impact bundle size

### Transform Performance

Enhanced transforms maintain the 92x performance improvement:

- **AST-based**: Efficient parsing and replacement
- **Protected patterns**: Avoid false positives
- **Concurrent processing**: Multiple transforms run in parallel

## Testing

The enhanced system supports comprehensive testing:

- **1:1 parity verification** with original Catalyst
- **Cross-theme consistency** checking
- **State interaction testing** (hover, active, focus)
- **Semantic token resolution** testing

## Future Roadmap

### Planned Enhancements

1. **Auto-generation**: Generate semantic tokens from design systems
2. **Visual diff tools**: Compare themes visually
3. **AI-powered optimization**: Suggest semantic token improvements
4. **Design tool integration**: Figma/Sketch plugin support

### Community Contributions

The enhanced semantic token system is designed for community extension:

- **Custom token categories**: Add your own semantic token types
- **Component-specific extensions**: Create tokens for custom components
- **Theme marketplace**: Share enhanced themes with the community

## Conclusion

The Enhanced Semantic Token System provides a simple, flexible approach to theming that works for everyone:

✅ **shadcn/ui compatible** - Works with any shadcn theme out of the box  
✅ **Progressive enhancement** - Add enhanced variables only when needed  
✅ **Perfect Catalyst parity** - Use the Catalyst preset for 1:1 visual match  
✅ **Smart fallbacks** - Components gracefully degrade when vars are missing  
✅ **No complexity** - No modes, no tiers, just optional variables  
✅ **92x performance improvement** maintained

Whether you're using a basic shadcn theme or need the full visual hierarchy of Catalyst UI, this system adapts to your needs without forcing unnecessary complexity.
