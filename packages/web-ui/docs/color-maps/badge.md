# Badge Component Color Mapping

## Component Overview

The Badge component is a small status indicator with color-coded variants. It consists of:
- **Badge** - Static badge display
- **BadgeButton** - Interactive badge that can be clicked or used as a link

The Badge supports 18 different color schemes, each with subtle background colors and strong text contrast. All badges use semi-transparent backgrounds for a modern appearance.

## Badge Base Styles

Common styling applied to all badge variants:

- **Layout**: `inline-flex items-center gap-x-1.5` - Flexible inline layout with icon support
- **Border Radius**: `rounded-md` - Medium rounded corners
- **Padding**: `px-1.5 py-0.5` - Compact padding
- **Typography**: `text-sm/5 font-medium sm:text-xs/5` - Small, medium-weight text
- **Accessibility**: `forced-colors:outline` - High contrast mode support

## BadgeButton Additional Styles

Interactive badges include focus management:

- **Focus Ring**: `data-focus:outline-blue-500` - Blue accessibility outline
- **Focus Offset**: `data-focus:outline-offset-2` - Proper spacing
- **Focus Width**: `data-focus:outline-2` - Standard outline width

## Color Variants Table

| Color | Background Light | Text Light | Hover Background Light | Background Dark | Text Dark | Hover Background Dark |
|-------|------------------|------------|------------------------|-----------------|-----------|----------------------|
| **red** | `bg-red-500/15` | `text-red-700` | `group-data-hover:bg-red-500/25` | `dark:bg-red-500/10` | `dark:text-red-400` | `dark:group-data-hover:bg-red-500/20` |
| **orange** | `bg-orange-500/15` | `text-orange-700` | `group-data-hover:bg-orange-500/25` | `dark:bg-orange-500/10` | `dark:text-orange-400` | `dark:group-data-hover:bg-orange-500/20` |
| **amber** | `bg-amber-400/20` | `text-amber-700` | `group-data-hover:bg-amber-400/30` | `dark:bg-amber-400/10` | `dark:text-amber-400` | `dark:group-data-hover:bg-amber-400/15` |
| **yellow** | `bg-yellow-400/20` | `text-yellow-700` | `group-data-hover:bg-yellow-400/30` | `dark:bg-yellow-400/10` | `dark:text-yellow-300` | `dark:group-data-hover:bg-yellow-400/15` |
| **lime** | `bg-lime-400/20` | `text-lime-700` | `group-data-hover:bg-lime-400/30` | `dark:bg-lime-400/10` | `dark:text-lime-300` | `dark:group-data-hover:bg-lime-400/15` |
| **green** | `bg-green-500/15` | `text-green-700` | `group-data-hover:bg-green-500/25` | `dark:bg-green-500/10` | `dark:text-green-400` | `dark:group-data-hover:bg-green-500/20` |
| **emerald** | `bg-emerald-500/15` | `text-emerald-700` | `group-data-hover:bg-emerald-500/25` | `dark:bg-emerald-500/10` | `dark:text-emerald-400` | `dark:group-data-hover:bg-emerald-500/20` |
| **teal** | `bg-teal-500/15` | `text-teal-700` | `group-data-hover:bg-teal-500/25` | `dark:bg-teal-500/10` | `dark:text-teal-300` | `dark:group-data-hover:bg-teal-500/20` |
| **cyan** | `bg-cyan-400/20` | `text-cyan-700` | `group-data-hover:bg-cyan-400/30` | `dark:bg-cyan-400/10` | `dark:text-cyan-300` | `dark:group-data-hover:bg-cyan-400/15` |
| **sky** | `bg-sky-500/15` | `text-sky-700` | `group-data-hover:bg-sky-500/25` | `dark:bg-sky-500/10` | `dark:text-sky-300` | `dark:group-data-hover:bg-sky-500/20` |
| **blue** | `bg-blue-500/15` | `text-blue-700` | `group-data-hover:bg-blue-500/25` | `bg-blue-500/15`* | `dark:text-blue-400` | `dark:group-data-hover:bg-blue-500/25` |
| **indigo** | `bg-indigo-500/15` | `text-indigo-700` | `group-data-hover:bg-indigo-500/25` | `bg-indigo-500/15`* | `dark:text-indigo-400` | `dark:group-data-hover:bg-indigo-500/20` |
| **violet** | `bg-violet-500/15` | `text-violet-700` | `group-data-hover:bg-violet-500/25` | `bg-violet-500/15`* | `dark:text-violet-400` | `dark:group-data-hover:bg-violet-500/20` |
| **purple** | `bg-purple-500/15` | `text-purple-700` | `group-data-hover:bg-purple-500/25` | `bg-purple-500/15`* | `dark:text-purple-400` | `dark:group-data-hover:bg-purple-500/20` |
| **fuchsia** | `bg-fuchsia-400/15` | `text-fuchsia-700` | `group-data-hover:bg-fuchsia-400/25` | `dark:bg-fuchsia-400/10` | `dark:text-fuchsia-400` | `dark:group-data-hover:bg-fuchsia-400/20` |
| **pink** | `bg-pink-400/15` | `text-pink-700` | `group-data-hover:bg-pink-400/25` | `dark:bg-pink-400/10` | `dark:text-pink-400` | `dark:group-data-hover:bg-pink-400/20` |
| **rose** | `bg-rose-400/15` | `text-rose-700` | `group-data-hover:bg-rose-400/25` | `dark:bg-rose-400/10` | `dark:text-rose-400` | `dark:group-data-hover:bg-rose-400/20` |
| **zinc** | `bg-zinc-600/10` | `text-zinc-700` | `group-data-hover:bg-zinc-600/20` | `dark:bg-white/5` | `dark:text-zinc-400` | `dark:group-data-hover:bg-white/10` |

*Note: Blue, indigo, violet, and purple don't specify explicit dark mode backgrounds, inheriting light mode values.

## Color Patterns

### Background Opacity Levels
- **Primary Colors (500 range)**: Use `/15` light, `/10` dark opacity
- **Light Colors (400 range)**: Use `/20` light, `/10` dark opacity
- **Hover States**: Increase opacity by +10 to +15 points

### Text Color Strategy
- **Light Mode**: Always use `*-700` (dark) for strong contrast
- **Dark Mode**: 
  - `*-400` for most colors (medium brightness)
  - `*-300` for light colors (yellow, lime, teal, cyan, sky)

### Special Cases

#### Neutral Badge (zinc)
- Uses completely different color scheme
- Light: `bg-zinc-600/10` with `text-zinc-700`
- Dark: `bg-white/5` with `text-zinc-400`

#### Blue Family Missing Dark Backgrounds
- Blue, indigo, violet, purple don't specify dark mode backgrounds
- Fall back to light mode background values
- May cause insufficient contrast in dark mode

### Hover Interactions
- **Light Mode**: Increase background opacity (+10 to +15)
- **Dark Mode**: Increase background opacity (+5 to +10)
- **Text Color**: Remains unchanged on hover

## Accessibility Features

### High Contrast Support
- `forced-colors:outline` ensures visibility in high contrast mode
- Strong text contrast ratios with dark text on light backgrounds
- Focus management with proper outline styling

### Interactive State Management
- Clear hover feedback through background changes
- Focus states with blue outline ring
- Consistent interactive patterns

## Semantic Mapping Recommendations

For migration to semantic tokens:

### Status Badges
- **Success states**: Use `green` → `success` token
- **Warning states**: Use `amber` or `yellow` → `warning` token  
- **Error states**: Use `red` → `destructive` token
- **Info states**: Use `blue` → `info` token
- **Default states**: Use `zinc` → `secondary` token

### Background Mapping
- Badge backgrounds → `secondary` with opacity modifiers
- Hover backgrounds → `secondary-hover` tokens
- Text colors → `secondary-foreground` tokens

### Brand Applications
- Primary brand → Use brand color with appropriate opacity
- Secondary brand → Use complementary colors
- Neutral content → Use zinc variant

## Design Principles

### Subtle Visual Impact
- Uses semi-transparent backgrounds to avoid overwhelming content
- Maintains readability while providing clear categorization
- Hover states provide gentle feedback

### Color Consistency
- Follows consistent opacity patterns across color families
- Maintains brand color relationships
- Provides clear dark mode adaptations

### Flexible Integration
- Works as static content or interactive element
- Supports icons and text content
- Maintains accessibility across contexts

## Notes

- Badge uses only background + text color (no borders)
- Hover states only affect background opacity
- Some dark mode backgrounds missing (blue family)
- Zinc variant uses completely different color logic
- All colors maintain WCAG contrast requirements