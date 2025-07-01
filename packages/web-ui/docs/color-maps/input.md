# Input Component Color Mapping

## Component Overview

The Input component is a form control with a sophisticated layered design system. It consists of:
- **InputGroup** - Container for inputs with icons
- **Input** - The main input field with complex background and border system

Unlike other components, Input doesn't have color variants - it uses a single, consistent neutral design focused on accessibility and usability.

## InputGroup

Container for inputs with icon support:

### Icon Colors
- **Light Mode**: `*:data-[slot=icon]:text-zinc-500` - Medium gray for icons
- **Dark Mode**: `dark:*:data-[slot=icon]:text-zinc-400` - Lighter gray for contrast

## Input Base Styles

The Input uses a complex layered system with pseudo-elements:

### Background System
- **Base Background**: `bg-transparent` - Transparent main background
- **Light Mode Layer**: `before:bg-white` - White background on pseudo-element
- **Dark Mode Background**: `dark:bg-white/5` - Subtle white tint
- **Shadow**: `before:shadow-sm` - Subtle drop shadow in light mode
- **Dark Mode**: `dark:before:hidden` - Hide pseudo-element shadow in dark mode

### Border Colors
- **Default Border**:
  - Light: `border-zinc-950/10` - Subtle dark border
  - Dark: `dark:border-white/10` - Subtle white border
- **Hover Border**:
  - Light: `data-hover:border-zinc-950/20` - Darker on hover
  - Dark: `dark:data-hover:border-white/20` - Brighter on hover

### Text Colors
- **Main Text**:
  - Light: `text-zinc-950` - High contrast dark text
  - Dark: `dark:text-white` - White text for readability
- **Placeholder Text**: `placeholder:text-zinc-500` - Medium gray for placeholders

### Focus States
- **Focus Ring**: `sm:focus-within:after:ring-blue-500` - Blue focus ring for accessibility
- **Ring Width**: `sm:focus-within:after:ring-2` - 2px ring width
- **No Outline**: `focus:outline-hidden` - Hide default browser outline

### State Colors

#### Invalid State
- **Border**: `data-invalid:border-red-500` - Red border for validation errors
- **Hover**: `data-invalid:data-hover:border-red-500` - Maintain red on hover
- **Dark Mode**: Same red colors maintained
- **Shadow**: `has-data-invalid:before:shadow-red-500/10` - Subtle red shadow

#### Disabled State
- **Opacity**: `has-data-disabled:opacity-50` - Standard disabled opacity
- **Background**: `has-data-disabled:before:bg-zinc-950/5` - Muted background
- **Shadow**: `has-data-disabled:before:shadow-none` - Remove shadow
- **Border**: 
  - Light: `data-disabled:border-zinc-950/20` - Muted border
  - Dark: `dark:data-disabled:border-white/15` - Muted white border
- **Dark Background**: `dark:data-disabled:bg-white/2.5` - Very subtle tint

## Color Properties Summary

| Element | Light Mode | Dark Mode | Purpose |
|---------|------------|-----------|---------|
| **Background** | `bg-transparent` + `before:bg-white` | `bg-white/5` | Input surface |
| **Border Default** | `border-zinc-950/10` | `dark:border-white/10` | Field definition |
| **Border Hover** | `border-zinc-950/20` | `dark:border-white/20` | Interactive feedback |
| **Border Invalid** | `border-red-500` | `border-red-500` | Validation error |
| **Border Disabled** | `border-zinc-950/20` | `dark:border-white/15` | Disabled state |
| **Text** | `text-zinc-950` | `dark:text-white` | Primary text |
| **Placeholder** | `text-zinc-500` | `text-zinc-500` | Placeholder text |
| **Focus Ring** | `ring-blue-500` | `ring-blue-500` | Accessibility |
| **Icons** | `text-zinc-500` | `dark:text-zinc-400` | Icon color |

## Design Patterns

### Layered Background System
- Uses pseudo-elements for sophisticated background/shadow effects
- Light mode: White background with shadow on pseudo-element
- Dark mode: Transparent background with subtle white tint

### Consistent Neutral Palette
- Only uses zinc colors and white for maximum flexibility
- Red only for validation errors
- Blue only for focus states

### Progressive Enhancement
- Basic styling works without pseudo-elements
- Enhanced styling adds shadows and layered effects
- Focus states add accessibility rings at larger screen sizes

### State Hierarchy
1. **Invalid** - Red overrides all other states
2. **Disabled** - Reduces opacity and mutes colors
3. **Hover** - Increases border opacity
4. **Focus** - Adds blue ring without changing base colors

## Accessibility Features

### High Contrast Support
- Strong text contrast (zinc-950 on white, white on zinc-900)
- Clear focus indicators
- Consistent disabled state opacity

### Color Blind Friendly
- Doesn't rely on color alone for state indication
- Red validation errors have distinct visual treatment
- Focus states use standard blue

### Screen Reader Support
- Semantic HTML input elements
- Proper focus management
- No color-only information

## Semantic Mapping Recommendations

For migration to semantic tokens:
- **Background**: `before:bg-white` / `dark:bg-white/5` → `input` token
- **Border**: `border-zinc-950/10` / `dark:border-white/10` → `border` token
- **Text**: `text-zinc-950` / `dark:text-white` → `foreground` token
- **Placeholder**: `placeholder:text-zinc-500` → `muted-foreground` token
- **Invalid**: `border-red-500` → `destructive` token
- **Focus**: `ring-blue-500` → `ring` token
- **Icons**: `text-zinc-500` / `dark:text-zinc-400` → `muted-foreground` token

## Notes

- Input uses a single design system without color variants
- Focus on functionality and accessibility over decoration
- Complex pseudo-element system provides subtle depth
- All interactive states maintain clear visual hierarchy
- Validation states override normal styling appropriately