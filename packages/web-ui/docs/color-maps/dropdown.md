# Dropdown Component Color Mapping

## Component Overview

The Dropdown component is a complex menu system with multiple sub-components. It consists of:

- **Dropdown** - Root menu container (no colors)
- **DropdownButton** - Trigger button (inherits from Button component)
- **DropdownMenu** - Floating menu panel with backdrop
- **DropdownItem** - Interactive menu items with focus states
- **DropdownHeader** - Plain content header (no colors)
- **DropdownSection** - Menu organization (no colors)
- **DropdownHeading** - Section headings with text styling
- **DropdownDivider** - Visual separators
- **DropdownLabel** - Item labels (no colors)
- **DropdownDescription** - Secondary item text
- **DropdownShortcut** - Keyboard shortcut display

Unlike other components, Dropdown uses a fixed neutral color scheme focused on readability and interaction states.

## DropdownMenu

The floating menu panel with backdrop and shadows:

### Background System

- **Light Mode**: `bg-white/75` - Semi-transparent white with blur
- **Dark Mode**: `dark:bg-zinc-800/75` - Semi-transparent dark surface
- **Backdrop Blur**: `backdrop-blur-xl` - Modern glass effect

### Border & Shadow

- **Ring Border**: `ring-zinc-950/10` - Subtle light mode border
- **Dark Ring**: `dark:ring-white/10` - Subtle dark mode border
- **Ring Inset**: `dark:ring-inset` - Inner ring positioning in dark mode
- **Shadow**: `shadow-lg` - Prominent drop shadow

### Accessibility

- **Outline**: `outline-transparent` - Transparent outline for forced colors
- **Focus**: `focus:outline-hidden` - Hide focus outline (handled by items)

## DropdownItem

Interactive menu items with sophisticated state management:

### Base Text Colors

- **Light Mode**: `text-zinc-950` - High contrast dark text
- **Dark Mode**: `dark:text-white` - White text for readability
- **Forced Colors**: `forced-colors:text-[CanvasText]` - System text color

### Focus States

- **Background**: `data-focus:bg-blue-500` - Blue background when focused
- **Text**: `data-focus:text-white` - White text on blue background
- **Forced Colors**: `forced-colors:data-focus:bg-[Highlight]` - System highlight

### Icon Colors

- **Default Icons**:
  - Light: `*:data-[slot=icon]:text-zinc-500` - Medium gray icons
  - Dark: `dark:*:data-[slot=icon]:text-zinc-400` - Lighter gray in dark mode
- **Focused Icons**:
  - Light: `data-focus:*:data-[slot=icon]:text-white` - White when focused
  - Dark: `dark:data-focus:*:data-[slot=icon]:text-white` - White when focused
- **Forced Colors**: `forced-colors:data-focus:*:data-[slot=icon]:text-[HighlightText]`

### Disabled State

- **Opacity**: `data-disabled:opacity-50` - Standard disabled appearance

## DropdownHeading

Section headings with muted styling:

- **Text Color**:
  - Light: `text-zinc-500` - Medium gray for hierarchy
  - Dark: `dark:text-zinc-400` - Lighter gray for contrast
- **Typography**: `font-medium text-sm/5 sm:text-xs/5` - Small, medium weight

## DropdownDivider

Visual separators between menu sections:

- **Background**:
  - Light: `bg-zinc-950/5` - Subtle dark separator
  - Dark: `dark:bg-white/10` - Subtle white separator
- **Forced Colors**: `forced-colors:bg-[CanvasText]` - System text color
- **Size**: `h-px` - 1px height line

## DropdownDescription

Secondary text for menu items:

- **Text Color**:
  - Light: `text-zinc-500` - Medium gray for secondary text
  - Dark: `dark:text-zinc-400` - Lighter gray for contrast
- **Focus State**: `group-data-focus:text-white` - White when parent focused
- **Forced Colors**: `forced-colors:group-data-focus:text-[HighlightText]`
- **Typography**: `text-sm/5 sm:text-xs/5` - Small text size

## DropdownShortcut

Keyboard shortcut indicators:

- **Text Color**: `text-zinc-400` - Muted gray for shortcuts
- **Focus State**: `group-data-focus:text-white` - White when parent focused
- **Forced Colors**: `forced-colors:group-data-focus:text-[HighlightText]`
- **Typography**: `font-sans capitalize` - System font, capitalized

## Color Properties Summary

| Element              | Light Mode                         | Dark Mode                                  | Focus State                   | Purpose           |
| -------------------- | ---------------------------------- | ------------------------------------------ | ----------------------------- | ----------------- |
| **Menu Background**  | `bg-white/75` + `backdrop-blur-xl` | `dark:bg-zinc-800/75` + `backdrop-blur-xl` | -                             | Panel surface     |
| **Menu Border**      | `ring-zinc-950/10`                 | `dark:ring-white/10`                       | -                             | Panel definition  |
| **Item Text**        | `text-zinc-950`                    | `dark:text-white`                          | `data-focus:text-white`       | Primary text      |
| **Item Background**  | `transparent`                      | `transparent`                              | `data-focus:bg-blue-500`      | Selection state   |
| **Icons**            | `text-zinc-500`                    | `dark:text-zinc-400`                       | `data-focus:text-white`       | Visual indicators |
| **Heading Text**     | `text-zinc-500`                    | `dark:text-zinc-400`                       | -                             | Section labels    |
| **Description Text** | `text-zinc-500`                    | `dark:text-zinc-400`                       | `group-data-focus:text-white` | Secondary info    |
| **Divider**          | `bg-zinc-950/5`                    | `dark:bg-white/10`                         | -                             | Visual separation |
| **Shortcuts**        | `text-zinc-400`                    | `text-zinc-400`                            | `group-data-focus:text-white` | Keyboard hints    |

## Design Patterns

### Glass Morphism Effect

- Semi-transparent backgrounds with backdrop blur
- Modern appearance with depth
- Maintains context visibility behind menu

### Single Focus Color

- Consistent blue (`blue-500`) for all focus states
- High contrast white text on blue background
- System color support for forced colors mode

### Hierarchical Text Colors

1. **Primary text** (zinc-950/white) - Main content
2. **Secondary text** (zinc-500/zinc-400) - Descriptions, headings
3. **Tertiary text** (zinc-400) - Shortcuts, subtle info

### State Management

- **Normal**: Neutral colors with good contrast
- **Focus**: Blue background with white text/icons
- **Disabled**: Opacity reduction only
- **Forced Colors**: System color compliance

## Accessibility Features

### High Contrast Support

- Strong text contrast ratios
- Forced colors mode compliance
- System color integration

### Focus Management

- Clear focus indicators with blue background
- Proper outline management
- Keyboard navigation support

### Color Independence

- Focus states don't rely on color alone
- Background changes accompany color changes
- System color fallbacks available

## Semantic Mapping Recommendations

For migration to semantic tokens:

### Menu Panel

- **Background**: `bg-white/75` / `dark:bg-zinc-800/75` → `popover` token with opacity
- **Border**: `ring-zinc-950/10` / `dark:ring-white/10` → `border` token
- **Shadow**: `shadow-lg` → `popover-shadow` token

### Menu Items

- **Text**: `text-zinc-950` / `dark:text-white` → `popover-foreground` token
- **Focus background**: `data-focus:bg-blue-500` → `accent` token
- **Focus text**: `data-focus:text-white` → `accent-foreground` token

### Secondary Elements

- **Icons**: `text-zinc-500` / `dark:text-zinc-400` → `muted-foreground` token
- **Descriptions**: `text-zinc-500` / `dark:text-zinc-400` → `muted-foreground` token
- **Headings**: `text-zinc-500` / `dark:text-zinc-400` → `muted-foreground` token
- **Dividers**: `bg-zinc-950/5` / `dark:bg-white/10` → `border` token

## Notes

- Dropdown uses no color variants (fixed neutral design)
- Focus states use consistent blue across all elements
- Glass morphism effect requires backdrop-blur support
- Complex grid system for layout (separate from colors)
- All interactive feedback through background + text color changes
- Forced colors mode fully supported throughout
