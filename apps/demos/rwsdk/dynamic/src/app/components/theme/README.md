# Theme System

A KISS (Keep It Simple, Stupid) theme system with just two components. Also supports preset-theme setups for maximum performance.

## Quick Start

### Option 1: Dynamic Theme Switching (Default)

```tsx
import { ThemeControl, ThemeModeToggle } from '@/app/components/theme'

// Full theme control (button → dialog)
<ThemeControl />

// Just mode switching
<ThemeModeToggle />
```

That's it. No props, no configuration, no magic.

### Option 2: Preset Theme (Maximum Performance)

For apps that don't need theme switching, use a preset theme for zero JavaScript overhead:

```css
/* styles.css */
@import 'tailwindcss';

@theme {
  /* Define your preset colors using oklch for perceptual uniformity */

  /* Primary: Your brand color (e.g., purple) */
  --color-primary-50: oklch(0.977 0.014 302.717);
  --color-primary-100: oklch(0.957 0.033 303.103);
  /* ... define all shades 50-950 ... */
  --color-primary-600: oklch(0.668 0.279 293.002);

  /* Secondary: Your secondary color (e.g., slate) */
  --color-secondary-50: oklch(0.984 0.003 264.695);
  /* ... define all shades ... */
  --color-secondary-600: oklch(0.446 0.043 256.959);

  /* Destructive: Error/danger color (usually red) */
  --color-destructive-600: oklch(0.577 0.245 27.325);

  /* Base: Your gray scale for UI elements */
  --color-base-50: oklch(0.985 0.002 247.858);
  /* ... define all shades ... */

  /* Layout: Your gray scale for navigation/structure */
  --color-layout-50: oklch(0.985 0.002 247.858);
  /* ... define all shades ... */

  /* Semantic pairs for contrast */
  --color-primary: var(--color-primary-600);
  --color-primary-foreground: white;

  --color-secondary: var(--color-secondary-600);
  --color-secondary-foreground: white;

  --color-destructive: var(--color-destructive-600);
  --color-destructive-foreground: white;
}
```

```tsx
/* Document.tsx - No theme components needed */
export const Document = ({ children }) => {
  return (
    <html lang="en" className="text-base-950 antialiased">
      <head>
        <link href={styles} rel="stylesheet" />
        {/* Optional: Support system dark mode preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Benefits of Preset Theme:**

- ⚡ Zero JavaScript for theming
- 🚀 ~15KB smaller bundle
- 🎯 No hydration issues
- 📈 Better performance scores
- 🎨 Still supports light/dark modes

## Components

### `<ThemeControl />`

A button that opens a dialog with all theme options.

```tsx
<ThemeControl />
```

**What it does:**

- Shows a button with paint brush icon
- Opens dialog on click
- Dialog has all theme options (mode, colors)
- Includes "Export Theme" button to generate CSS
- Zero configuration

### `<ThemeModeToggle />`

A button that cycles through light → dark → system modes.

```tsx
<ThemeModeToggle />
```

**What it does:**

- Shows appropriate icon (sun/moon/computer)
- Cycles through modes on click
- Includes tooltip
- Zero configuration

## Setup

Add the theme initializer to your root component:

```tsx
import { Initializer } from '@/app/components/theme'

export function Document({ children }) {
  return (
    <html>
      <body>
        <Initializer />
        {children}
      </body>
    </html>
  )
}
```

## Need Custom UI?

Use the hooks directly:

```tsx
import { useMode, useThemeActions } from '@/app/components/theme'

function CustomThemeButton() {
  const mode = useMode()
  const layout = useLayout()
  const { setMode, setPrimary, setLayout } = useThemeActions()

  return (
    <div>
      <button onClick={() => setMode('dark')}>Current: {mode}</button>
      <button onClick={() => setLayout('zinc')}>Layout: {layout}</button>
    </div>
  )
}
```

## Available Hooks

```tsx
// Read state (optimal re-renders)
useMode() // 'light' | 'dark' | 'system'
usePrimary() // Current primary color
useSecondary() // Current secondary color
useDestructive() // Current destructive color
useBase() // Current base color for content
useLayout() // Current layout color for navigation

// Actions (stable references)
const { setMode, setPrimary, setSecondary, setDestructive, setBase, setLayout } = useThemeActions()
```

## Features

- 🎨 **Semantic Color System** - Primary, Secondary, Destructive, Base, and Layout colors
- 🌓 **Dark/Light/System** mode support
- 🚀 **SSR-safe** with no hydration issues
- 💾 **Persistent** theme preferences (cookies)
- ⚡ **Performant** using CSS variable overrides
- 🎯 **Tailwind CSS native** - works with all Tailwind utilities
- 📤 **Export Theme** - Generate CSS from current theme configuration
- 🧩 **KISS API** - Just 2 components, 7 hooks

## Using Theme Colors

The theme system maps semantic colors to Tailwind color scales:

```tsx
// These utilities automatically use theme colors
<div className="bg-primary-500 text-primary-50">Primary themed</div>
<div className="bg-secondary-200 border-secondary-700">Secondary themed</div>
<div className="bg-destructive-600 text-white">Danger zone</div>
<div className="bg-base-100 text-base-900">Base gray scale (content)</div>
<div className="bg-layout-100 text-layout-900">Layout gray scale (navigation)</div>
```

### Layout vs Base Colors

- **Base**: Used for content areas, cards, inputs, and general UI
- **Layout**: Used for sidebars, navigation, and structural components
- This separation allows for better visual hierarchy (e.g., darker sidebar with lighter content)

## Available Colors

All Tailwind colors are available:

- **Grays**: zinc, slate, gray, neutral, stone
- **Colors**: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose

## How It Works

The theme system uses CSS variable overrides to dynamically map semantic color tokens to Tailwind colors:

```css
/* Default mapping */
--color-primary-500: var(--color-emerald-500);

/* Runtime override */
style="--color-primary-500: var(--color-purple-500);"
```

## Examples

### In a Navbar

```tsx
<nav className="flex items-center justify-between p-4">
  <Logo />
  <div className="flex items-center gap-2">
    <ThemeModeToggle />
    <UserMenu />
  </div>
</nav>
```

### In Settings

```tsx
<div className="settings-page">
  <h1>Settings</h1>
  <section>
    <h2>Appearance</h2>
    <ThemeControl />
  </section>
</div>
```

### With Keyboard Shortcuts

```tsx
function App() {
  const { setMode } = useThemeActions()

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.metaKey && e.key === 't') {
        setMode((current) =>
          current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
        )
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return <YourApp />
}
```

## Choosing Between Dynamic and Preset Themes

### Use Dynamic Themes When:

- Users need to personalize their experience
- Supporting multiple brands/white-label
- A/B testing different color schemes
- Accessibility requires user choice

### Use Preset Themes When:

- Brand colors are predetermined
- Performance is critical
- Simplicity is valued
- Users don't need customization

## Preset Theme Examples

### Example 1: Simple Brand Colors

```css
@import 'tailwindcss';

@theme {
  /* Brand: Blue primary, gray secondary */
  --color-primary-500: oklch(0.637 0.237 254.624);
  --color-primary-600: oklch(0.605 0.213 254.624);
  --color-secondary-600: oklch(0.456 0.03 256.802);
  --color-destructive-600: oklch(0.577 0.245 27.325);

  /* Semantic mappings */
  --color-primary: var(--color-primary-600);
  --color-primary-foreground: white;
  --color-secondary: var(--color-secondary-600);
  --color-secondary-foreground: white;
  --color-destructive: var(--color-destructive-600);
  --color-destructive-foreground: white;
}
```

### Example 2: Using Tailwind's Predefined Colors

```css
@import 'tailwindcss';

@theme {
  /* Map semantic colors directly to Tailwind colors */
  --color-primary-50: var(--color-blue-50);
  --color-primary-100: var(--color-blue-100);
  /* ... repeat for all shades ... */
  --color-primary-600: var(--color-blue-600);

  --color-secondary-50: var(--color-gray-50);
  /* ... repeat for all shades ... */

  /* Semantic pairs */
  --color-primary: var(--color-blue-600);
  --color-primary-foreground: white;
}
```

### Example 3: Minimal Setup (Just What You Use)

```css
@import 'tailwindcss';

@theme {
  /* Only define the exact shades you use */
  --color-primary: #2563eb; /* blue-600 */
  --color-primary-foreground: white;

  --color-secondary: #4b5563; /* gray-600 */
  --color-secondary-foreground: white;

  --color-destructive: #dc2626; /* red-600 */
  --color-destructive-foreground: white;

  /* Map base to existing grays */
  --color-base-100: var(--color-gray-100);
  --color-base-200: var(--color-gray-200);
  --color-base-900: var(--color-gray-900);
}
```

## Theme Export Feature

The theme dialog includes an "Export Theme" button that generates static CSS from your current theme configuration. This is perfect for:

- Converting from dynamic to preset themes
- Sharing theme configurations
- Creating theme presets
- Debugging theme issues

**How it works:**

1. Configure your theme using the dialog
2. Click "Export Theme" button
3. Copy the generated CSS
4. Use it in your styles.css for a preset theme setup

The exported CSS includes:

- All color shades with computed OKLCH values
- Proper foreground/background contrast pairs
- Complete @theme block ready to use
- Comments explaining the configuration

## Philosophy

**KISS**: Keep It Simple, Stupid

- **Dynamic**: Two components (`<ThemeControl />`, `<ThemeModeToggle />`)
- **Preset**: Zero components, just CSS
- No props, no configuration
- Need custom UI? Use the hooks (dynamic) or CSS (preset)

90% of apps just need consistent brand colors. Choose the simplest approach for your needs.
