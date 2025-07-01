# Checkbox Component Color Mapping

## Component Overview

The Checkbox component is a form control with sophisticated visual states. It consists of:
- **CheckboxGroup** - Container for multiple checkboxes (no colors)
- **CheckboxField** - Layout wrapper for checkbox with label/description (no colors)
- **Checkbox** - The actual checkbox control with extensive color system

The Checkbox supports 20 different color schemes with complex state management for checked, hover, focus, and disabled states.

## Base Styles (`base`)

Core colors and variables used in all checkbox variants:

### Background System
- **Light Mode Base**: `before:bg-white` - White background on pseudo-element
- **Dark Mode Base**: `dark:bg-white/5` - Subtle white tint for unchecked state
- **Checked Background**: `group-data-checked:before:bg-(--checkbox-checked-bg)` - Uses CSS custom property
- **Dark Checked**: `dark:group-data-checked:bg-(--checkbox-checked-bg)` - Direct background in dark mode

### Border Colors
- **Default Border**:
  - Light: `border-zinc-950/15` - Subtle dark border
  - Dark: `dark:border-white/15` - Subtle white border
- **Hover Border**:
  - Light: `group-data-hover:border-zinc-950/30` - Darker on hover
  - Dark: `dark:group-data-hover:border-white/30` - Brighter on hover
- **Checked Border**: `group-data-checked:border-transparent` - Hidden when checked
- **Checked Background Border**: `group-data-checked:bg-(--checkbox-checked-border)` - Uses custom property

### Focus & Interactive States
- **Focus Ring**: `group-data-focus:outline-blue-500` - Blue accessibility outline
- **Inner Highlight**: `after:shadow-[inset_0_1px_--theme(--color-white/15%)]` - Subtle inner glow
- **Disabled Opacity**: `group-data-disabled:opacity-50` - Standard disabled state

### Disabled State Colors
- **Light Mode Disabled**:
  - Border: `group-data-disabled:border-zinc-950/25`
  - Background: `group-data-disabled:bg-zinc-950/5`
  - Check Color: `group-data-disabled:[--checkbox-check:var(--color-zinc-950)]/50`
- **Dark Mode Disabled**:
  - Border: `dark:group-data-disabled:border-white/20`
  - Background: `dark:group-data-disabled:bg-white/2.5`
  - Check Color: `dark:group-data-disabled:[--checkbox-check:var(--color-white)]/50`

### Accessibility
- **Forced Colors**: `forced-colors:[--checkbox-check:HighlightText]` and `forced-colors:[--checkbox-checked-bg:Highlight]`

## Color Variants Table

| Color | Check Mark | Checked Background | Checked Border | Dark Mode Notes |
|-------|------------|-------------------|----------------|-----------------|
| **dark/zinc** | `var(--color-white)` | `var(--color-zinc-900)` | `var(--color-zinc-950)/90` | Dark: `var(--color-zinc-600)` bg |
| **dark/white** | `var(--color-white)` | `var(--color-zinc-900)` | `var(--color-zinc-950)/90` | Dark: zinc-900 check, white bg |
| **white** | `var(--color-zinc-900)` | `var(--color-white)` | `var(--color-zinc-950)/15` | Inverted colors |
| **dark** | `var(--color-white)` | `var(--color-zinc-900)` | `var(--color-zinc-950)/90` | Same in dark mode |
| **zinc** | `var(--color-white)` | `var(--color-zinc-600)` | `var(--color-zinc-700)/90` | Same in dark mode |
| **red** | `var(--color-white)` | `var(--color-red-600)` | `var(--color-red-700)/90` | Same in dark mode |
| **orange** | `var(--color-white)` | `var(--color-orange-500)` | `var(--color-orange-600)/90` | Same in dark mode |
| **amber** | `var(--color-amber-950)` | `var(--color-amber-400)` | `var(--color-amber-500)/80` | Light color scheme |
| **yellow** | `var(--color-yellow-950)` | `var(--color-yellow-300)` | `var(--color-yellow-400)/80` | Light color scheme |
| **lime** | `var(--color-lime-950)` | `var(--color-lime-300)` | `var(--color-lime-400)/80` | Light color scheme |
| **green** | `var(--color-white)` | `var(--color-green-600)` | `var(--color-green-700)/90` | Same in dark mode |
| **emerald** | `var(--color-white)` | `var(--color-emerald-600)` | `var(--color-emerald-700)/90` | Same in dark mode |
| **teal** | `var(--color-white)` | `var(--color-teal-600)` | `var(--color-teal-700)/90` | Same in dark mode |
| **cyan** | `var(--color-cyan-950)` | `var(--color-cyan-300)` | `var(--color-cyan-400)/80` | Light color scheme |
| **sky** | `var(--color-white)` | `var(--color-sky-500)` | `var(--color-sky-600)/80` | Same in dark mode |
| **blue** | `var(--color-white)` | `var(--color-blue-600)` | `var(--color-blue-700)/90` | Same in dark mode |
| **indigo** | `var(--color-white)` | `var(--color-indigo-500)` | `var(--color-indigo-600)/90` | Same in dark mode |
| **violet** | `var(--color-white)` | `var(--color-violet-500)` | `var(--color-violet-600)/90` | Same in dark mode |
| **purple** | `var(--color-white)` | `var(--color-purple-500)` | `var(--color-purple-600)/90` | Same in dark mode |
| **fuchsia** | `var(--color-white)` | `var(--color-fuchsia-500)` | `var(--color-fuchsia-600)/90` | Same in dark mode |
| **pink** | `var(--color-white)` | `var(--color-pink-500)` | `var(--color-pink-600)/90` | Same in dark mode |
| **rose** | `var(--color-white)` | `var(--color-rose-500)` | `var(--color-rose-600)/90` | Same in dark mode |

## CSS Custom Properties

The Checkbox component uses these CSS custom properties:

- **`--checkbox-check`**: Color of the checkmark icon (stroke color)
- **`--checkbox-checked-bg`**: Background color when checked
- **`--checkbox-checked-border`**: Border color when checked (used as background)

## SVG Icon System

The checkbox uses an inline SVG with two paths:
- **Checkmark**: `stroke-(--checkbox-check)` - Uses the custom property for stroke color
- **Indeterminate**: Same stroke color, different path for indeterminate state
- **State Control**: Opacity toggles between checked/indeterminate states

## Color Patterns

### Light Color Schemes
Some colors use dark checkmarks on light backgrounds:
- **amber, yellow, lime, cyan** - Use dark checkmarks (`*-950`) for contrast
- **white** - Uses dark checkmark on white background

### Opacity Variations
- **Border opacity**: Most borders use `/90` or `/80` opacity for subtle effects
- **Disabled states**: Use `/50` opacity for check colors when disabled
- **Background tints**: Use low opacity (`/5`, `/15`) for subtle backgrounds

### Dark Mode Adaptations
- **Neutral colors**: `dark/zinc` and `dark/white` have specific dark mode variations
- **Brand colors**: Most maintain same colors in dark mode
- **White variant**: Maintains light appearance in both modes

## Interactive States

### Hover Effects
- Border opacity increases from `/15` to `/30`
- Checked state maintains `border-transparent`

### Focus States
- Blue outline ring for accessibility
- No color changes to checkbox itself

### Disabled States
- Opacity reduction to 50%
- Muted border and background colors
- Reduced check color opacity

## Semantic Mapping Recommendations

For migration to semantic tokens:
- **Primary checkboxes**: Use `dark/zinc` → `primary` token
- **Success checkboxes**: Use `green` → `success` token
- **Destructive checkboxes**: Use `red` → `destructive` token
- **Default state**: Background and border → `input` tokens
- **Check mark**: `--checkbox-check` → `primary-foreground` when checked