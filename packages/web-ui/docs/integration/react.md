# Generic React Integration Guide

This guide covers how to integrate Trailhead UI with generic React projects or custom build setups.

> **Note**: This documentation is part of the [Trailhead monorepo](../../../../../README.md).

## Overview

This guide is for React projects that don't use a specific framework like Next.js or Vite. It covers the essential steps to integrate Trailhead UI with any React build setup.

## Prerequisites

- React 18+ or 19+
- Tailwind CSS 3.4+ or 4.0+
- A build tool that supports CSS modules and PostCSS

## Step 1: Install Dependencies

```bash
pnpm add github:esteban-url/trailhead#packages/web-ui next-themes
```

## Step 2: Add CSS Custom Properties

Create or update your main CSS file (e.g., `src/index.css` or `src/App.css`):

```css
/* Import Tailwind */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Theme Variables */
@layer base {
  :root {
    /* Core semantic tokens */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* Primary colors */
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    /* Secondary colors */
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;

    /* Muted colors */
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* Accent colors */
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;

    /* Destructive colors */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    /* Border and input colors */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    /* Radius */
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

/* Base styles */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Step 3: Configure Tailwind CSS

Create or update your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    // Add your content paths here
  ],
  theme: {
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

## Step 4: Add ThemeProvider

Wrap your app with the ThemeProvider component. The exact location depends on your app structure:

### Option 1: Root Component

```tsx
// src/App.tsx or src/App.jsx
import { ThemeProvider } from './components/theme-provider'
import './index.css' // or your CSS file

function App() {
  return <ThemeProvider>{/* Your app content */}</ThemeProvider>
}

export default App
```

### Option 2: Index File

```tsx
// src/index.tsx or src/index.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './components/theme-provider'
import App from './App'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
```

## Step 5: Import Styles

Make sure your CSS file is imported early in your application:

```tsx
// In your root component or index file
import './index.css' // or your CSS file path
```

## Step 6: Start Using Components

Now you can use Trailhead UI components:

```tsx
import { Button, Input, Card, Badge } from 'trailhead-ui'

function MyComponent() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Example Form</h2>

      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input id="name" placeholder="Enter your name" />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit">Submit</Button>
          <Badge variant="secondary">Optional</Badge>
        </div>
      </form>
    </Card>
  )
}
```

## Build Tool Configuration

### Webpack

If using Webpack, ensure you have the necessary loaders:

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
}
```

### Rollup

For Rollup, use the PostCSS plugin:

```js
// rollup.config.js
import postcss from 'rollup-plugin-postcss'

export default {
  plugins: [
    postcss({
      config: {
        path: './postcss.config.js',
      },
      extensions: ['.css'],
      minimize: true,
    }),
  ],
}
```

### PostCSS Configuration

Create a `postcss.config.js`:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## TypeScript Configuration

If using TypeScript, add path mappings to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/lib/*": ["src/lib/*"]
    },
    "jsx": "react-jsx",
    "moduleResolution": "bundler"
  }
}
```

## Common Issues and Solutions

### CSS Not Applied

1. **Check import order**: CSS must be imported before components are used
2. **Verify build process**: Ensure PostCSS and Tailwind are processing your CSS
3. **Check content paths**: Tailwind config must scan all component files

### Module Resolution Errors

1. **Update imports**: Use relative imports if path aliases aren't configured
2. **Check build tool config**: Ensure your bundler supports the import syntax
3. **Verify package installation**: Run `npm ls trailhead-ui` to check

### Theme Not Switching

1. **Check ThemeProvider**: Must wrap the entire app
2. **Verify CSS classes**: The `.dark` class must be defined
3. **Check localStorage**: Theme preference is stored in `theme` key

## Advanced Usage

### Custom Theme Implementation

```tsx
// components/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  )
}
```

### Theme Switcher Component

```tsx
// components/theme-switcher.tsx
import { useTheme } from 'next-themes'
import { Button } from 'trailhead-ui'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

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

### Server-Side Rendering

If your setup supports SSR:

```tsx
// Prevent hydration mismatch
<html suppressHydrationWarning>
  <body>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>
```

## Testing

### With React Testing Library

```tsx
import { render } from '@testing-library/react'
import { ThemeProvider } from 'trailhead-ui'

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider defaultTheme="light">{ui}</ThemeProvider>)
}
```

### With Jest

Add CSS module mocks:

```js
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
}
```

## Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Trailhead UI Components](../components.md)
- [Theme Configuration](../configuration.md)
