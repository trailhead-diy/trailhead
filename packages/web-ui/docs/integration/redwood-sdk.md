# RedwoodSDK Integration Guide

This guide covers how to integrate Trailhead UI with RedwoodSDK projects using modern Tailwind CSS v4.

> **Note**: This documentation is part of the [Trailhead monorepo](../../../../../README.md).

## Overview

RedwoodSDK uses Tailwind CSS v4 with the `@tailwindcss/vite` plugin, providing seamless integration with Trailhead UI's semantic token system. The modern approach uses `@theme` blocks for customization instead of traditional configuration files.

## Prerequisites

- RedwoodSDK project
- Node.js 18+ or 20+
- Trailhead UI package

## Step 1: Install Dependencies

```bash
# Install Tailwind CSS and the Vite plugin
pnpm add tailwindcss @tailwindcss/vite

# Install Trailhead UI from the monorepo
pnpm add github:esteban-url/trailhead#packages/web-ui next-themes
```

## Step 2: Configure Vite Plugin

Update your `vite.config.mts` to include the Tailwind CSS Vite plugin:

```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { redwood } from 'rwsdk/vite'

export default defineConfig({
  environments: {
    ssr: {},
  },
  plugins: [redwood(), tailwindcss()],
})
```

## Step 3: Create Styles File

Create `src/app/styles.css` and import Tailwind CSS:

```css
@import 'tailwindcss';

@theme {
  /* Trailhead UI semantic tokens */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);

  /* Border radius */
  --radius: 0.5rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* Dark mode support */
@custom-variant dark (&:is(.dark *));

.dark {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  --color-card: oklch(0.205 0 0);
  --color-card-foreground: oklch(0.985 0 0);
  --color-popover: oklch(0.205 0 0);
  --color-popover-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.922 0 0);
  --color-primary-foreground: oklch(0.205 0 0);
  --color-secondary: oklch(0.269 0 0);
  --color-secondary-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.269 0 0);
  --color-muted-foreground: oklch(0.708 0 0);
  --color-accent: oklch(0.269 0 0);
  --color-accent-foreground: oklch(0.985 0 0);
  --color-destructive: oklch(0.704 0.191 22.216);
  --color-border: oklch(1 0 0 / 10%);
  --color-input: oklch(1 0 0 / 15%);
  --color-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Step 4: Link Styles in Document

Update your `src/app/Document.tsx` to include the stylesheet:

```tsx
import styles from './styles.css?url'

export default function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={styles} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## Step 5: Add ThemeProvider

Create a theme provider component in `src/app/components/theme-provider.tsx`:

```tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
```

## Step 6: Wrap Your App

Wrap your app with the ThemeProvider. The exact location depends on your app structure:

### Option 1: Root Layout

```tsx
// src/app/layout.tsx or equivalent
import { ThemeProvider } from 'trailhead-ui'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
```

### Option 2: App Component

```tsx
// src/app/App.tsx
import { ThemeProvider } from 'trailhead-ui'

export default function App() {
  return <ThemeProvider>{/* Your app content */}</ThemeProvider>
}
```

## Step 7: Start Using Components

Now you can import and use Trailhead UI components:

```tsx
import { Button, Input, Card, Badge } from 'trailhead-ui'

export default function MyPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to Trailhead UI</h1>

        <div className="space-y-4">
          <Input placeholder="Enter your name" />
          <Button className="w-full">Get Started</Button>
          <Badge variant="secondary">New Feature</Badge>
        </div>
      </Card>
    </div>
  )
}
```

## Step 8: Add Theme Switcher (Optional)

Create a theme switcher component in `src/app/components/theme-switcher.tsx`:

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Button } from 'trailhead-ui'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  )
}
```

Then use it in your components:

```tsx
import { ThemeSwitcher } from 'trailhead-ui'

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>My RedwoodSDK App</h1>
      <ThemeSwitcher />
    </header>
  )
}
```

## Custom Themes

You can create custom themes by extending the `@theme` block in your `styles.css`:

```css
@theme {
  /* Custom purple theme */
  --color-primary: oklch(0.65 0.25 271);
  --color-primary-foreground: oklch(1 0 0);

  /* Custom brand colors */
  --color-brand: oklch(0.6 0.2 180);
  --color-brand-foreground: oklch(1 0 0);
}
```

Then use them in your components:

```tsx
<Button className="bg-brand text-brand-foreground">Custom Brand Button</Button>
```

## Troubleshooting

### Styles Not Loading

1. Ensure `styles.css` is properly imported in `Document.tsx`
2. Verify the Vite plugin is correctly configured
3. Check that the `@import "tailwindcss"` is at the top of your CSS file

### Dark Mode Not Working

1. Verify the `@custom-variant dark` directive is present
2. Check that ThemeProvider is wrapping your entire app
3. Ensure dark mode styles are defined in the `.dark` class

### TypeScript Errors

1. Make sure your `tsconfig.json` has proper path mappings
2. Verify that component files were installed correctly
3. Check that peer dependencies are installed

### Colors Not Applied

1. Ensure OKLCH color values are properly formatted
2. Check that CSS custom properties are defined in the `@theme` block
3. Verify color names match Trailhead UI's semantic tokens

## Advanced Configuration

### Custom Fonts

Add custom fonts to your `@theme` block:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: 'Inter', sans-serif;
  --font-display: 'Inter', sans-serif;
}
```

### Multiple Theme Variants

Create theme variants by defining additional CSS classes:

```css
.theme-purple {
  --color-primary: oklch(0.65 0.25 271);
  --color-primary-foreground: oklch(1 0 0);
}

.theme-green {
  --color-primary: oklch(0.6 0.2 142);
  --color-primary-foreground: oklch(1 0 0);
}
```

### Component-Specific Overrides

Override specific component styles using Tailwind utilities:

```css
@layer components {
  .custom-button {
    @apply bg-gradient-to-r from-purple-500 to-pink-500 text-white;
  }
}
```

## Performance Tips

1. **Use specific imports** to reduce bundle size
2. **Leverage RedwoodSDK's SSR** for better initial loading
3. **Optimize images** with RedwoodSDK's asset handling
4. **Use theme switching** judiciously to avoid layout shifts

## Resources

- [RedwoodSDK Documentation](https://docs.rwsdk.com/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Trailhead UI Components](../components.md)
- [Theme Configuration](../configuration.md)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
