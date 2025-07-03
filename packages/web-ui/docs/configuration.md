# Configuration

Configure Trailhead UI's theming system and customize appearance.

> **Note**: This documentation is part of the [Trailhead monorepo](../../../README.md).

## Theme Provider

The `ThemeProvider` component wraps your app and provides theme management capabilities through integration with `next-themes`.

### Props

```tsx
interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string // Default: 'zinc'
  storageKey?: string // Default: 'theme' (localStorage key)
  enableSystem?: boolean // Default: true (detect system preference)
}
```

### Features

- **SSR-safe**: No hydration mismatches or flash of unstyled content
- **Automatic persistence**: Themes saved to localStorage via next-themes
- **System detection**: Respects OS dark/light mode preference
- **Dynamic theme registration**: Add themes at runtime
- **Instant switching**: CSS custom properties enable immediate updates

## useTheme Hook

The `useTheme` hook provides access to theme state and controls:

```tsx
interface ThemeContextValue {
  currentTheme: string | null // Current theme name ('zinc', 'purple', etc.)
  isDark: boolean // Current dark mode state
  themes: string[] // All available theme names
  setTheme: (name: string) => void // Switch to a theme
  toggleDarkMode: () => void // Toggle dark/light mode
  registerTheme: (name: string, config: TrailheadThemeConfig) => void // Add new theme
}
```

### Usage Examples

```tsx
import { useTheme } from '@esteban-url/trailhead-web-ui'

function ThemeControls() {
  const { currentTheme, isDark, themes, setTheme, toggleDarkMode, registerTheme } = useTheme()

  // Display current theme
  console.log(`Current theme: ${currentTheme}${isDark ? ' (dark)' : ''}`)

  // List available themes
  console.log('Available themes:', themes)
  // ['red', 'rose', 'orange', 'green', 'blue', 'yellow', 'violet', 'catalyst']

  // Switch theme
  const switchToGreen = () => setTheme('green')

  // Toggle dark mode
  const toggleDark = () => toggleDarkMode()

  // Register custom theme
  const addCustomTheme = () => {
    const customTheme = createTheme('custom').withPrimaryColor('oklch(0.7 0.2 180)').build()
    registerTheme('custom', customTheme)
  }
}
```

### Theme Persistence

Theme persistence is handled automatically by next-themes:

- Themes are saved to localStorage using the configured `storageKey`
- The `data-theme` attribute tracks current theme for CSS targeting
- SSR-safe with automatic script injection to prevent flashing
- Supports system theme detection when `enableSystem` is true

### Examples

```tsx
// Basic configuration
<ThemeProvider>
  {children}
</ThemeProvider>

// Custom default theme
<ThemeProvider defaultTheme="purple">
  {children}
</ThemeProvider>

// Disable system theme detection
<ThemeProvider enableSystem={false}>
  {children}
</ThemeProvider>

// Custom storage key (for multiple themes)
<ThemeProvider storageKey="admin-theme">
  {children}
</ThemeProvider>
```

## Preventing Flash of Unstyled Content

To prevent theme flashing on initial load, ensure you have `suppressHydrationWarning` on your html tag:

```tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
```

The `next-themes` library (used by ThemeProvider) automatically injects the necessary script to prevent flash of unstyled content.

## CSS Custom Properties

Trailhead UI uses CSS custom properties for theming. Each theme defines these tokens:

### Color Tokens

```css
/* Core colors */
--background: oklch(0.99 0 0);
--foreground: oklch(0.145 0 0);

/* UI colors */
--card: oklch(0.99 0 0);
--card-foreground: oklch(0.145 0 0);
--popover: oklch(0.99 0 0);
--popover-foreground: oklch(0.145 0 0);

/* Interactive colors */
--primary: oklch(0.21 0.034 264.665);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.967 0.003 264.542);
--secondary-foreground: oklch(0.163 0.004 264.665);

/* Semantic colors */
--muted: oklch(0.966 0.003 264.542);
--muted-foreground: oklch(0.455 0.022 264.665);
--accent: oklch(0.966 0.003 264.542);
--accent-foreground: oklch(0.163 0.004 264.665);
--destructive: oklch(0.577 0.215 27.351);
--destructive-foreground: oklch(0.985 0 0);

/* Form colors */
--border: oklch(0.892 0.009 264.665);
--input: oklch(0.892 0.009 264.665);
--ring: oklch(0.619 0.133 264.665);

/* Chart colors */
--chart-1: oklch(0.301 0.053 264.665);
--chart-2: oklch(0.784 0.067 264.665);
--chart-3: oklch(0.407 0.081 264.665);
--chart-4: oklch(0.508 0.1 264.665);
--chart-5: oklch(0.638 0.128 264.665);
```

### Dark Mode

Dark mode variants are automatically applied with the `.dark` class:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... other dark mode tokens ... */
}
```

## Semantic Token System

Trailhead UI components use semantic color tokens throughout. When Catalyst components are converted, their hardcoded colors are automatically mapped to semantic tokens:

### Conversion Mappings

- **Focus states**: Colors like `zinc-950`, `gray-900` → `primary` token
- **Disabled states**: Colors like `zinc-950/5`, `black/5` → `muted` token with opacity
- **Borders**: Colors like `zinc-200`, `gray-300` → `border` token
- **Backgrounds**: Light grays → `muted` or `accent` tokens
- **Text colors**: Dark grays → `foreground` or `muted-foreground` tokens

Example conversions:

```tsx
// Original Catalyst
<div className="focus:ring-zinc-950/10 disabled:bg-zinc-950/5">

// Converted to semantic tokens
<div className="focus:ring-primary/20 disabled:bg-muted/50">
```

## Tailwind Integration

### Using Semantic Colors

```tsx
// Use semantic color utilities
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground border border-border">
    <button className="bg-primary text-primary-foreground">Primary Button</button>
  </div>
</div>
```

### Custom Tailwind Config

Extend Tailwind with custom semantic colors:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        // Chart colors
        chart: {
          1: 'oklch(var(--chart-1) / <alpha-value>)',
          2: 'oklch(var(--chart-2) / <alpha-value>)',
          3: 'oklch(var(--chart-3) / <alpha-value>)',
          4: 'oklch(var(--chart-4) / <alpha-value>)',
          5: 'oklch(var(--chart-5) / <alpha-value>)',
        },
      },
    },
  },
}
```

Note: The `<alpha-value>` placeholder enables opacity modifiers like `bg-primary/50`.

## Creating Custom Themes

### Option 1: CSS Variables

Define a custom theme using CSS:

```css
[data-theme='custom'] {
  --background: oklch(0.98 0.01 250);
  --foreground: oklch(0.15 0.01 250);
  --primary: oklch(0.6 0.2 250);
  --primary-foreground: oklch(0.98 0 0);
  /* ... define all required tokens ... */
}

[data-theme='custom'].dark {
  --background: oklch(0.15 0.01 250);
  --foreground: oklch(0.98 0.01 250);
  /* ... dark mode tokens ... */
}
```

### Option 2: Theme Builder API

Create themes programmatically using the functional theme builder (located in `/src/components/theme/builder.ts`):

```tsx
import { createTheme } from '@esteban-url/trailhead-web-ui'

// Build a custom theme using the fluent API
const customTheme = createTheme('custom')
  .withPrimaryColor('oklch(0.6 0.2 250)')
  .withBackgroundColors('oklch(0.98 0.01 250)', 'oklch(0.15 0.01 250)')
  .withSecondaryColor('oklch(0.5 0.15 200)')
  .withMutedColor('oklch(0.95 0.01 250)', 'oklch(0.25 0.01 250)')
  .withAccentColor('oklch(0.94 0.02 250)', 'oklch(0.26 0.02 250)')
  .withDestructiveColor('oklch(0.6 0.25 25)')
  .build()

// Register the theme using useTheme hook
const { registerTheme } = useTheme()
registerTheme('custom', customTheme)
```

### Option 3: CLI Installation

Use the Trailhead UI CLI for automatic setup:

```bash
# Install Trailhead UI from the monorepo
pnpm add github:esteban-url/trailhead#packages/web-ui

# Run interactive installation
pnpm exec trailhead-ui install

# The CLI will:
# 1. Detect your framework (Next.js, Vite, etc.)
# 2. Configure theme provider
# 3. Set up Tailwind integration
# 4. Add component imports
```

### Option 4: Dynamic Theme Management

For runtime theme management, use the `useTheme` hook:

```tsx
import { useTheme } from '@esteban-url/trailhead-web-ui'

function ThemeManager() {
  const { themes, currentTheme, setTheme, registerTheme } = useTheme()

  // Get available themes
  console.log(themes) // ['zinc', 'purple', 'green', 'orange', ...]

  // Switch to a different theme
  const handleThemeChange = (themeName: string) => {
    setTheme(themeName)
  }

  // Register a new theme dynamically
  const addCustomTheme = () => {
    const customTheme = createTheme('my-theme').withPrimaryColor('oklch(0.7 0.15 180)').build()

    registerTheme('my-theme', customTheme)
    setTheme('my-theme')
  }
}
```

See [Theme Registry](./theme-registry.md) for advanced usage.

## Environment-Specific Themes

### Development vs Production

**Recommended Approach: Use Configuration Files**

Instead of relying on environment variables, use configuration files for better maintainability:

```tsx
// trailhead.config.ts
export const themeConfig = {
  development: {
    defaultTheme: 'purple',
    enableDebug: true,
  },
  production: {
    defaultTheme: 'zinc',
    enableDebug: false,
  },
}

// In your app
import { themeConfig } from './trailhead.config'

// Determine environment from build configuration or other means
const config = themeConfig[buildMode] || themeConfig.production

<ThemeProvider defaultTheme={config.defaultTheme}>
  {children}
</ThemeProvider>
```

This approach provides:

- Type safety with TypeScript
- Easier testing and mocking
- No runtime environment variable dependencies
- Clear configuration management

### User Preferences

```tsx
function App() {
  const [userTheme, setUserTheme] = useState(() => {
    // Load from user profile/database
    return getUserPreference() || 'zinc'
  })

  return (
    <ThemeProvider defaultTheme={userTheme}>
      <ThemeSettings onThemeChange={setUserTheme} />
      {children}
    </ThemeProvider>
  )
}
```

## Performance Optimization

### Runtime Theme Switching

Themes are applied using CSS custom properties, enabling instant theme switching without page reloads:

```tsx
// Themes are applied immediately via CSS variables
const { setTheme } = useTheme()
setTheme('purple') // Instant theme change
```

### SSR Optimization

The next-themes integration ensures:

- No flash of unstyled content
- Automatic script injection for theme detection
- Smooth transitions after hydration

### Bundle Size

Themes add minimal overhead:

- CSS custom properties: ~2KB per theme
- Theme registry logic: ~5KB gzipped
- No runtime CSS injection after initial load

## Next-themes Integration

Trailhead UI uses [next-themes](https://github.com/pacocoursey/next-themes) internally to provide robust theme management with SSR support.

### What next-themes Handles

- **Persistence**: Saves theme preference to localStorage
- **SSR Safety**: Prevents hydration mismatches and flash of unstyled content
- **System Detection**: Detects and responds to OS color scheme changes
- **Script Injection**: Automatically injects blocking script to prevent FOUC
- **Theme Attributes**: Manages `data-theme` attribute on html element

### Integration Architecture

```tsx
// Trailhead UI wraps next-themes internally
<ThemeProvider>
  {' '}
  // Trailhead's ThemeProvider
  <NextThemesProvider>
    {' '}
    // next-themes provider (internal)
    <YourApp />
  </NextThemesProvider>
</ThemeProvider>
```

### Theme Name Format

Trailhead UI extends next-themes' theme naming to support color + mode combinations:

- `zinc` - Zinc theme in light mode
- `zinc-dark` - Zinc theme in dark mode
- `light` - Default light mode (zinc)
- `dark` - Default dark mode (zinc)
- `system` - Follow OS preference

### Direct next-themes Access

While Trailhead UI provides its own `useTheme` hook, you can also access next-themes directly if needed:

```tsx
import { useTheme as useNextTheme } from 'next-themes'

function AdvancedThemeControl() {
  const { theme, setTheme, resolvedTheme, systemTheme, themes } = useNextTheme()

  // Access raw next-themes state
  console.log('Raw theme:', theme) // e.g., 'purple-dark', 'system'
  console.log('Resolved:', resolvedTheme) // Actual theme after system resolution
  console.log('System:', systemTheme) // 'light' or 'dark'
}
```

### Configuration Options

next-themes options are configured through Trailhead's ThemeProvider:

```tsx
<ThemeProvider
  defaultTheme="zinc"      // Maps to next-themes defaultTheme
  storageKey="theme"       // Maps to next-themes storageKey
  enableSystem={true}      // Maps to next-themes enableSystem
>
```

### Custom Attributes

Trailhead UI configures next-themes to use `data-theme` attribute:

```html
<!-- Light mode -->
<html data-theme="zinc">
  <!-- Dark mode -->
  <html data-theme="zinc-dark" class="dark"></html>
</html>
```

This enables CSS targeting:

```css
[data-theme='purple'] {
  /* Purple theme styles */
}

[data-theme='purple-dark'] {
  /* Purple dark theme styles */
}
```

## Accessibility

### High Contrast Mode

```tsx
// Detect and apply high contrast
const prefersHighContrast = window.matchMedia(
  '(prefers-contrast: high)'
).matches

<ThemeProvider
  defaultTheme={prefersHighContrast ? 'high-contrast' : 'zinc'}
>
  {children}
</ThemeProvider>
```

### Reduced Motion

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Converting Custom Components

When adapting components to use semantic tokens:

1. **Identify hardcoded colors**:

   ```tsx
   // Before
   className = 'bg-gray-100 text-gray-900 focus:ring-gray-500'
   ```

2. **Map to semantic tokens**:

   ```tsx
   // After
   className = 'bg-muted text-foreground focus:ring-primary'
   ```

3. **Use the CLI**:

   ```bash
   # Use CLI for new projects
   trailhead-ui install

   # Or transform existing components to use semantic tokens
   trailhead-ui transforms
   ```

The transform pipeline (located in `/src/transforms/`) will automatically convert colors to appropriate semantic tokens using AST-based transformations.

## Next Steps

- [Theme Registry](./theme-registry.md) - Advanced theme management
- [Examples](./examples.md) - Real-world configuration examples
- [Components](./components.md) - Component customization
