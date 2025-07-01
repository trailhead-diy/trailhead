# Next.js Integration Guide

This guide covers how to integrate Trailhead UI with Next.js projects, supporting both App Router and Pages Router.

> **Note**: This documentation is part of the [Trailhead monorepo](../../../../../README.md).

## Overview

Next.js integration is automated through the Trailhead UI CLI. For manual setup, Next.js requires specific configuration for CSS custom properties and Tailwind CSS to work with Trailhead UI's theming system.

## CLI Installation (Recommended)

```bash
# Install Trailhead UI from the monorepo
pnpm add github:esteban-url/trailhead#packages/web-ui

# Run automated Next.js setup
pnpm exec trailhead-ui install --framework nextjs

# The CLI will:
# - Detect Next.js app structure
# - Configure theme provider in root layout
# - Set up Tailwind configuration
# - Install all 27 components with semantic tokens
# - Configure TypeScript paths
```

## Step 1: Add CSS Custom Properties

Add the theme variables to your global CSS file.

### App Router: `app/globals.css`

### Pages Router: `styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
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

## Step 2: Update Tailwind Configuration

Update your `tailwind.config.js` to use the CSS custom properties:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

## Step 3: Add ThemeProvider

### App Router (Recommended)

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'trailhead-ui'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Your app description',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

### Pages Router

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { ThemeProvider } from 'trailhead-ui'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

## Step 4: Start Using Components

Now you can use Trailhead UI components in your pages:

```tsx
// app/page.tsx or pages/index.tsx
import { Button, Input, Card } from 'trailhead-ui'

export default function Home() {
  return (
    <main className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <div className="space-y-4">
          <Input placeholder="Enter your email" type="email" />
          <Button className="w-full">Get Started</Button>
        </div>
      </Card>
    </main>
  )
}
```

## Step 5: Add Theme Switcher (Optional)

Create a client component for theme switching:

```tsx
// components/theme-toggle.tsx
'use client'

import { useTheme } from 'trailhead-ui'
import { Button } from 'trailhead-ui'

export function ThemeToggle() {
  const { isDark, toggleDarkMode } = useTheme()

  return (
    <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
      {isDark ? '☀️' : '🌙'}
    </Button>
  )
}
```

## Important Notes

### CSS Import Order

- **App Router**: Import `globals.css` in your root layout
- **Pages Router**: Import `globals.css` in `_app.tsx`
- Ensure CSS is imported before using components

### Hydration

- Add `suppressHydrationWarning` to the `<html>` element to prevent hydration warnings from theme switching
- The ThemeProvider handles SSR automatically with next-themes

### TypeScript Configuration

Ensure your `tsconfig.json` has proper path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    }
  }
}
```

## Troubleshooting

### CSS Variables Not Working

- Check that `globals.css` is imported in the correct location
- Verify Tailwind is processing your CSS (check for Tailwind classes working)
- Ensure CSS variables are wrapped with `hsl()` in the Tailwind config

### Dark Mode Not Switching

- Verify `darkMode: ["class"]` is set in your Tailwind config
- Check that ThemeProvider is wrapping your entire app
- Ensure the `.dark` class styles are defined in your CSS

### Build Errors

- If using Turbopack, ensure all dependencies are compatible
- Check that all imports use the correct paths
- Verify peer dependencies are installed

## Advanced Usage

### Custom Themes

Create custom themes by modifying CSS variables:

```css
/* Custom purple theme */
:root {
  --primary: 271 91% 65%;
  --primary-foreground: 0 0% 100%;
}
```

### Server Components

When using Server Components, create a client wrapper:

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'trailhead-ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

### Middleware Integration

You can read theme preferences in middleware:

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const theme = request.cookies.get('theme')
  // Use theme value for server-side logic if needed
  return NextResponse.next()
}
```

## Performance Tips

1. **Use dynamic imports** for heavy components
2. **Optimize images** with Next.js Image component
3. **Enable CSS modules** for component-specific styles
4. **Use static generation** where possible

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Trailhead UI Components](../components.md)
- [Theme Configuration](../configuration.md)
- [App Router Migration](https://nextjs.org/docs/app)
