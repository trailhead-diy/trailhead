# Button Component Color Mapping

## Component Overview

The Button component is a fundamental interactive element with a sophisticated color system. It supports three main variants:

- **Solid** - The default style with full background colors
- **Outline** - Border-only style with transparent background
- **Plain** - Minimal style with no border, transparent background

The component supports 22 different color schemes, each with specific mappings for text, background, border, and icon colors.

## Base Styles (`styles.base`)

Colors and variables used in the foundational button styles:

- **Focus Ring**: `data-focus:outline-blue-500` - Blue focus outline for accessibility
- **Icon Color**: `--btn-icon` - CSS custom property for icon coloring
- **Forced Colors**: `forced-colors:[--btn-icon:ButtonText]` - High contrast mode support
- **Disabled State**: `data-disabled:opacity-50` - Opacity-based disabled state

## Solid Variant (`styles.solid`)

The primary button style with full backgrounds:

- **Optical Border**: `--btn-border` - Background color used for border effect
- **Main Background**: `--btn-bg` - Primary button background color
- **Dark Mode Border**: `dark:border-white/5` - Subtle white border in dark mode
- **Hover Overlay**: `--btn-hover-overlay` - Semi-transparent overlay for hover states
- **Shadow Effects**: `before:shadow-sm` - Drop shadow on the background layer
- **Inner Highlight**: `after:shadow-[inset_0_1px_--theme(--color-white/15%)]` - Inner light reflection

## Outline Variant (`styles.outline`)

Border-only style with transparent backgrounds:

- **Border Colors**:
  - Light: `border-zinc-950/10`
  - Dark: `dark:border-white/15`
- **Text Colors**:
  - Light: `text-zinc-950`
  - Dark: `dark:text-white`
- **Hover/Active Backgrounds**:
  - Light: `data-hover:bg-zinc-950/2.5`, `data-active:bg-zinc-950/2.5`
  - Dark: `dark:data-hover:bg-white/5`, `dark:data-active:bg-white/5`
- **Icon Colors**: `--btn-icon` with zinc-based variations

## Plain Variant (`styles.plain`)

Minimal style with no borders:

- **Border**: `border-transparent` - No visible border
- **Text Colors**:
  - Light: `text-zinc-950`
  - Dark: `dark:text-white`
- **Hover/Active Backgrounds**:
  - Light: `data-hover:bg-zinc-950/5`, `data-active:bg-zinc-950/5`
  - Dark: `dark:data-hover:bg-white/10`, `dark:data-active:bg-white/10`
- **Icon Colors**: `--btn-icon` with zinc-based variations

## Color Variants Table

| Color          | Text              | Background (`--btn-bg`)    | Border (`--btn-border`)       | Hover Overlay               | Icon Base                  | Icon Hover/Active          | Dark Mode Notes                       |
| -------------- | ----------------- | -------------------------- | ----------------------------- | --------------------------- | -------------------------- | -------------------------- | ------------------------------------- |
| **dark/zinc**  | `text-white`      | `var(--color-zinc-900)`    | `var(--color-zinc-950)/90`    | `var(--color-white)/10`     | `var(--color-zinc-400)`    | `var(--color-zinc-300)`    | Different bg: `var(--color-zinc-600)` |
| **light**      | `text-zinc-950`   | `white`                    | `var(--color-zinc-950)/10`    | `var(--color-zinc-950)/2.5` | `var(--color-zinc-500)`    | `var(--color-zinc-700)`    | Dark: white text, zinc-800 bg         |
| **dark/white** | `text-white`      | `var(--color-zinc-900)`    | `var(--color-zinc-950)/90`    | `var(--color-white)/10`     | `var(--color-zinc-400)`    | `var(--color-zinc-300)`    | Dark: zinc-950 text, white bg         |
| **dark**       | `text-white`      | `var(--color-zinc-900)`    | `var(--color-zinc-950)/90`    | `var(--color-white)/10`     | `var(--color-zinc-400)`    | `var(--color-zinc-300)`    | Dark: zinc-800 bg                     |
| **white**      | `text-zinc-950`   | `white`                    | `var(--color-zinc-950)/10`    | `var(--color-zinc-950)/2.5` | `var(--color-zinc-400)`    | `var(--color-zinc-500)`    | No dark mode changes                  |
| **zinc**       | `text-white`      | `var(--color-zinc-600)`    | `var(--color-zinc-700)/90`    | `var(--color-white)/10`     | `var(--color-zinc-400)`    | `var(--color-zinc-300)`    | Same in dark                          |
| **indigo**     | `text-white`      | `var(--color-indigo-500)`  | `var(--color-indigo-600)/90`  | `var(--color-white)/10`     | `var(--color-indigo-300)`  | `var(--color-indigo-200)`  | Same in dark                          |
| **cyan**       | `text-cyan-950`   | `var(--color-cyan-300)`    | `var(--color-cyan-400)/80`    | `var(--color-white)/25`     | `var(--color-cyan-500)`    | Same as base               | Light color scheme                    |
| **red**        | `text-white`      | `var(--color-red-600)`     | `var(--color-red-700)/90`     | `var(--color-white)/10`     | `var(--color-red-300)`     | `var(--color-red-200)`     | Same in dark                          |
| **orange**     | `text-white`      | `var(--color-orange-500)`  | `var(--color-orange-600)/90`  | `var(--color-white)/10`     | `var(--color-orange-300)`  | `var(--color-orange-200)`  | Same in dark                          |
| **amber**      | `text-amber-950`  | `var(--color-amber-400)`   | `var(--color-amber-500)/80`   | `var(--color-white)/25`     | `var(--color-amber-600)`   | Same as base               | Light color scheme                    |
| **yellow**     | `text-yellow-950` | `var(--color-yellow-300)`  | `var(--color-yellow-400)/80`  | `var(--color-white)/25`     | `var(--color-yellow-600)`  | `var(--color-yellow-700)`  | Light color scheme                    |
| **lime**       | `text-lime-950`   | `var(--color-lime-300)`    | `var(--color-lime-400)/80`    | `var(--color-white)/25`     | `var(--color-lime-600)`    | `var(--color-lime-700)`    | Light color scheme                    |
| **green**      | `text-white`      | `var(--color-green-600)`   | `var(--color-green-700)/90`   | `var(--color-white)/10`     | `var(--color-white)/60`    | `var(--color-white)/80`    | White icons                           |
| **emerald**    | `text-white`      | `var(--color-emerald-600)` | `var(--color-emerald-700)/90` | `var(--color-white)/10`     | `var(--color-white)/60`    | `var(--color-white)/80`    | White icons                           |
| **teal**       | `text-white`      | `var(--color-teal-600)`    | `var(--color-teal-700)/90`    | `var(--color-white)/10`     | `var(--color-white)/60`    | `var(--color-white)/80`    | White icons                           |
| **sky**        | `text-white`      | `var(--color-sky-500)`     | `var(--color-sky-600)/80`     | `var(--color-white)/10`     | `var(--color-white)/60`    | `var(--color-white)/80`    | White icons                           |
| **blue**       | `text-white`      | `var(--color-blue-600)`    | `var(--color-blue-700)/90`    | `var(--color-white)/10`     | `var(--color-blue-400)`    | `var(--color-blue-300)`    | Blue-tinted icons                     |
| **violet**     | `text-white`      | `var(--color-violet-500)`  | `var(--color-violet-600)/90`  | `var(--color-white)/10`     | `var(--color-violet-300)`  | `var(--color-violet-200)`  | Same in dark                          |
| **purple**     | `text-white`      | `var(--color-purple-500)`  | `var(--color-purple-600)/90`  | `var(--color-white)/10`     | `var(--color-purple-300)`  | `var(--color-purple-200)`  | Same in dark                          |
| **fuchsia**    | `text-white`      | `var(--color-fuchsia-500)` | `var(--color-fuchsia-600)/90` | `var(--color-white)/10`     | `var(--color-fuchsia-300)` | `var(--color-fuchsia-200)` | Same in dark                          |
| **pink**       | `text-white`      | `var(--color-pink-500)`    | `var(--color-pink-600)/90`    | `var(--color-white)/10`     | `var(--color-pink-300)`    | `var(--color-pink-200)`    | Same in dark                          |
| **rose**       | `text-white`      | `var(--color-rose-500)`    | `var(--color-rose-600)/90`    | `var(--color-white)/10`     | `var(--color-rose-300)`    | `var(--color-rose-200)`    | Same in dark                          |

## CSS Custom Properties

The Button component uses these CSS custom properties for dynamic color theming:

- **`--btn-bg`**: Main button background color
- **`--btn-border`**: Optical border color (used as background for border effect)
- **`--btn-hover-overlay`**: Semi-transparent overlay for hover states
- **`--btn-icon`**: Icon color that adapts to different states

## Color Patterns

### Light Color Schemes

Some colors use dark text on light backgrounds for better contrast:

- **cyan, amber, yellow, lime** - Use dark text (`text-{color}-950`) with lighter backgrounds

### Icon Color Strategies

- **Most colors**: Use lighter tints of the same color family for icons
- **Green/Emerald/Teal/Sky**: Use white icons with opacity for subtlety
- **Blue**: Uses blue-tinted icons instead of white for brand consistency

### Dark Mode Adaptations

- **Neutral colors**: Often use different background shades in dark mode
- **Brand colors**: Usually maintain the same colors in both modes
- **Special cases**: `dark/white` inverts completely in dark mode

## Semantic Mapping Recommendations

For migration to semantic tokens:

- **Primary buttons**: Use `dark/zinc` or brand colors → `primary` token
- **Secondary buttons**: Use `light` or `outline` variant → `secondary` token
- **Destructive actions**: Use `red` → `destructive` token
- **Success actions**: Use `green` → `success` token (if available)
- **Warning actions**: Use `amber` or `yellow` → `warning` token (if available)
