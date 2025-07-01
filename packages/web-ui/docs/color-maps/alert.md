# Alert Component Color Mapping

## Component Overview

The Alert component is a modal dialog system with backdrop overlay. It consists of several sub-components:

- **Alert** - Main container with backdrop and positioning
- **AlertTitle** - Title text with semantic styling
- **AlertDescription** - Description text using the Text component
- **AlertBody** - Content area
- **AlertActions** - Action buttons container

Unlike other components, Alert uses a minimal color scheme focused on neutrals and accessibility.

## Main Alert Container

Colors used in the primary Alert component:

### Backdrop

- **Light Mode**: `bg-zinc-950/15` - Semi-transparent dark overlay
- **Dark Mode**: `dark:bg-zinc-950/50` - Heavier dark overlay for better contrast

### Dialog Panel

- **Background**:
  - Light: `bg-white` - Clean white background
  - Dark: `dark:bg-zinc-900` - Dark surface
- **Ring/Border**:
  - Light: `ring-zinc-950/10` - Subtle dark border
  - Dark: `dark:ring-white/10` - Subtle white border
- **Forced Colors**: `forced-colors:outline` - High contrast mode support

## AlertTitle

Text styling for alert titles:

- **Text Color**:
  - Light: `text-zinc-950` - High contrast dark text
  - Dark: `dark:text-white` - White text for readability
- **Typography**: `font-semibold` - Medium weight for hierarchy
- **Layout**: Center/left alignment based on screen size

## AlertDescription

Uses the Text component for description styling - inherits its color system.

## Color Properties Summary

| Element              | Light Mode                   | Dark Mode                    | Purpose          |
| -------------------- | ---------------------------- | ---------------------------- | ---------------- |
| **Backdrop**         | `bg-zinc-950/15`             | `dark:bg-zinc-950/50`        | Modal overlay    |
| **Panel Background** | `bg-white`                   | `dark:bg-zinc-900`           | Content surface  |
| **Panel Border**     | `ring-zinc-950/10`           | `dark:ring-white/10`         | Panel definition |
| **Title Text**       | `text-zinc-950`              | `dark:text-white`            | Primary text     |
| **Description**      | Inherits from Text component | Inherits from Text component | Secondary text   |

## Design Patterns

### Neutral Color Scheme

Alert uses only neutral colors (zinc/white) to:

- Maintain focus on content over decoration
- Ensure accessibility across all contexts
- Provide maximum flexibility for different alert types

### Layered Transparency

- **Backdrop**: Uses transparency to maintain context
- **Borders**: Subtle transparency for elegant separation
- **No brand colors**: Keeps alerts contextually neutral

### High Contrast Support

- **Forced colors mode**: `forced-colors:outline` ensures visibility
- **Strong text contrast**: zinc-950 on white, white on zinc-900
- **Accessible transparency levels**: 15% and 50% for optimal readability

## Semantic Mapping Recommendations

For migration to semantic tokens:

- **Panel background**: `bg-white` / `dark:bg-zinc-900` → `card` or `popover` token
- **Panel border**: `ring-zinc-950/10` / `dark:ring-white/10` → `border` token
- **Title text**: `text-zinc-950` / `dark:text-white` → `foreground` token
- **Backdrop**: Custom overlay tokens for modal backgrounds

## Notes

- Alert doesn't use color variants like other components
- Focuses on typography and spacing over color
- Backdrop opacity differs between light/dark mode for optimal UX
- All colors are accessibility-focused with high contrast ratios
