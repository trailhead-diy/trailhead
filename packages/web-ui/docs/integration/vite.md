# Vite Integration Guide

This guide covers how to integrate Trailhead UI with Vite-based React projects.

> **Note**: This documentation is part of the [Trailhead monorepo](../../../../../README.md).

## Overview

Vite integration is automated through the Trailhead UI CLI. For manual setup, Vite provides a fast development experience and works seamlessly with Trailhead UI's theming system.

## CLI Installation (Recommended)

```bash
# Install Trailhead UI from the monorepo
pnpm add github:esteban-url/trailhead#packages/web-ui

# Run Vite setup
pnpm exec trailhead-ui install --framework vite

# The CLI will:
# - Configure Vite with Tailwind CSS v4
# - Set up theme provider in main.tsx
# - Install all 27 components
# - Configure import paths
```

## Step 1: Add CSS Custom Properties

Add the theme variables to your `src/index.css` file:

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
    font-feature-settings:
      'rlig' 1,
      'calt' 1;
  }
}
```

## Step 2: Update Tailwind Configuration

Update your `tailwind.config.js` to use ES modules and the CSS custom properties:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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

Wrap your app with ThemeProvider in `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'trailhead-ui'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
```

## Step 4: Configure Path Aliases

Update your `vite.config.ts` to support path aliases:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },
})
```

Also update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

## Step 5: Start Using Components

Now you can use Trailhead UI components in your app:

```tsx
// src/App.tsx
import { Button, Input, Card } from 'trailhead-ui'
import { ThemeSwitcher } from 'trailhead-ui'

function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Vite App</h1>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          <div className="space-y-4">
            <Input placeholder="Enter your name" />
            <Button className="w-full">Submit</Button>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default App
```

## Development Tips

### Hot Module Replacement (HMR)

Vite's HMR works automatically with Trailhead UI components. Changes to theme variables in CSS will update instantly.

### Build Optimization

Vite automatically tree-shakes unused components. Only import what you need:

```tsx
// Good - specific imports
import { Button, Input } from 'trailhead-ui'

// Avoid - imports everything
import * as UI from 'trailhead-ui'
```

### Environment Variables

**Recommended: Use Configuration Files**

For better maintainability and type safety, prefer configuration files:

```tsx
// src/config/theme.config.ts
export const themeConfig = {
  defaultTheme: 'zinc',
  availableThemes: ['zinc', 'purple', 'green', 'orange'],
  enableDebug: import.meta.env.DEV, // Use Vite's built-in DEV flag
}

// src/main.tsx
import { themeConfig } from './config/theme.config'

<ThemeProvider defaultTheme={themeConfig.defaultTheme}>
  <App />
</ThemeProvider>
```

**Alternative: Vite Environment Variables**

If you need environment-specific configuration:

```tsx
// .env
VITE_DEFAULT_THEME=zinc

// src/main.tsx
<ThemeProvider defaultTheme={import.meta.env.VITE_DEFAULT_THEME || 'zinc'}>
  <App />
</ThemeProvider>
```

Configuration files are preferred as they provide type safety and are easier to test.

## Troubleshooting

### Path Aliases Not Working

1. Ensure both `vite.config.ts` and `tsconfig.json` have matching path configurations
2. Restart the Vite dev server after configuration changes
3. Check that paths use forward slashes, even on Windows

### CSS Not Loading

1. Verify `index.css` is imported in `main.tsx`
2. Check that PostCSS is configured correctly
3. Ensure Tailwind directives are at the top of your CSS file

### ES Module Errors

1. Use `export default` in `tailwind.config.js` (not `module.exports`)
2. Ensure all config files use ES module syntax
3. Check that your `package.json` doesn't have `"type": "commonjs"`

### Build Issues

If you encounter build errors:

```bash
# Clear cache and reinstall
rm -rf node_modules .vite
pnpm install

# Build with verbose output
pnpm build -- --debug
```

## Advanced Configuration

### Custom PostCSS Plugins

Add a `postcss.config.js` for additional plugins:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Add more plugins here
  },
}
```

### Multiple Themes

Create theme variants by extending the CSS:

```css
/* Purple theme variant */
.theme-purple {
  --primary: 271 91% 65%;
  --primary-foreground: 0 0% 100%;
}

/* Usage */
<div className="theme-purple">
  <Button>Purple Button</Button>
</div>
```

### Production Optimization

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'trailhead-ui': ['trailhead-ui'],
        },
      },
    },
  },
})
```

## Example Project Structure

```
my-vite-app/
├── src/
│   ├── components/
│   │   ├── theme-provider.tsx
│   │   └── theme-switcher.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [Trailhead UI Components](../components.md)
- [Theme Configuration](../configuration.md)
- [Vite Plugin Ecosystem](https://vitejs.dev/plugins/)
