# RedwoodJS SDK Demo - Trailhead UI

A RedwoodJS SDK application demonstrating @esteban-url/trailhead-web-ui components and theming system.

**Part of the [Trailhead Monorepo](../../../README.md)** - This demo showcases the UI library with RedwoodJS SDK.

## Setup Instructions

### 1. Install Components

From the demo directory or monorepo root:

```bash
# From monorepo root
pnpm exec trailhead-ui install --filter=rwsdk-demo

# Or from demo directory
cd apps/demos/rwsdk
pnpm trailhead-ui install
```

### 2. Add Layout Component

Create a new file `src/app/components/layout.tsx`:

```tsx
import { ThemeProvider } from '@/app/components/th'

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)
```

### 3. Update Home Page

Update `src/app/pages/Home.tsx`:

```tsx
import { RequestInfo } from 'rwsdk/worker'
import { Layout } from '../components/layout'

export function Home({ ctx }: RequestInfo) {
  return (
    <Layout>
      <h1>Hello World</h1>
    </Layout>
  )
}
```

### 4. Update Vite Configuration

Update `vite.config.mts`:

```ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { redwood } from 'rwsdk/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  environments: {
    ssr: {},
  },
  plugins: [
    cloudflare({
      viteEnvironment: { name: 'worker' },
    }),
    redwood(),
    tailwindcss(),
  ],
})
```

### 5. Create CSS File

Create a new file `src/app/styles.css`:

```css
@source "./**/*.{js,ts,jsx,tsx,mdx}";

@theme {
  --font-sans: Inter, sans-serif;
  --font-sans--font-feature-settings: 'cv11';

  /* Define semantic colors for Tailwind utilities */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  :root {
    /* Default theme values - will be overridden by theme system */
    --background: oklch(100% 0 0);
    --foreground: oklch(4.9% 0.02 222.2);
    --primary: oklch(11.2% 0.02 222.2);
    --primary-foreground: oklch(98% 0 210);
    --secondary: oklch(96% 0.005 210);
    --secondary-foreground: oklch(4.9% 0.02 222.2);
    --muted: oklch(96% 0.005 210);
    --muted-foreground: oklch(46.9% 0.01 215.4);
    --accent: oklch(96% 0.005 210);
    --accent-foreground: oklch(4.9% 0.02 222.2);
    --destructive: oklch(60.2% 0.25 0);
    --destructive-foreground: oklch(98% 0 210);
    --border: oklch(91.4% 0.01 214.3);
    --input: oklch(91.4% 0.01 214.3);
    --ring: oklch(4.9% 0.02 222.2);
    --radius: 0.5rem;
  }

  .dark {
    /* Default dark theme values - will be overridden by theme system */
    --background: oklch(4.9% 0.02 222.2);
    --foreground: oklch(98% 0 210);
    --primary: oklch(98% 0 210);
    --primary-foreground: oklch(4.9% 0.02 222.2);
    --secondary: oklch(17.5% 0.01 217.2);
    --secondary-foreground: oklch(98% 0 210);
    --muted: oklch(17.5% 0.01 217.2);
    --muted-foreground: oklch(65.1% 0.01 215);
    --accent: oklch(17.5% 0.01 217.2);
    --accent-foreground: oklch(98% 0 210);
    --destructive: oklch(30.6% 0.2 0);
    --destructive-foreground: oklch(98% 0 210);
    --border: oklch(17.5% 0.01 217.2);
    --input: oklch(17.5% 0.01 217.2);
    --ring: oklch(83.9% 0.01 212.7);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }

  /* Prevent flash during theme transitions */
  html.theme-changing * {
    transition: none !important;
  }

  /* Ensure sidebar has immediate background */
  nav:has([data-slot='sidebar']) {
    background-color: var(--card, oklch(100% 0 0));
  }

  .dark nav:has([data-slot='sidebar']) {
    background-color: var(--card, oklch(21% 0.006 285.885));
  }
}
```

### 6. Import CSS in Document

Update `src/app/document.tsx`:

```tsx
import styles from "./styles.css?url";
...
<head>
  ...
  <link rel="preconnect" href="https://rsms.me/" />
  <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
  <link rel="stylesheet" href={styles} />
  ...
</head>
```

## 🛠️ Development

### From Monorepo Root (Recommended)

```bash
# Install all dependencies
pnpm install

# Run the RedwoodJS SDK demo
pnpm dev --filter=rwsdk-demo

# Build the demo
pnpm build --filter=rwsdk-demo

# Lint the demo
pnpm lint --filter=rwsdk-demo
```

### From Demo Directory

```bash
# Navigate to demo
cd apps/demos/rwsdk

# Install dependencies (if not done from root)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 🚀 Features

- **RedwoodJS SDK** - Modern edge-first framework
- **@esteban-url/trailhead-web-ui** - All 26 components with theme system
- **21 Built-in Themes** - Professional themes with dark mode
- **Cloudflare Workers** - Edge deployment ready
- **Tailwind CSS 4** - Modern utility-first CSS
- **TypeScript** - Full type safety

## 📁 Project Structure

```
apps/demos/rwsdk/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── layout.tsx    # ThemeProvider wrapper
│   │   │   └── th/           # Trailhead UI components
│   │   ├── pages/
│   │   │   └── Home.tsx      # Main demo page
│   │   ├── Document.tsx      # HTML document setup
│   │   └── styles.css        # Theme CSS configuration
│   ├── client.tsx            # Client entry point
│   └── worker.tsx            # Worker entry point
├── vite.config.mts           # Vite configuration
├── wrangler.jsonc            # Cloudflare configuration
└── package.json              # Dependencies
```

## 🎨 Theming

The demo showcases @esteban-url/trailhead-web-ui's theming capabilities:

- **Runtime theme switching** - Change themes without reload
- **Dark mode support** - Automatic system preference detection
- **Semantic color tokens** - Consistent styling across components
- **Theme persistence** - Remembers user's theme choice
- **OKLCH color space** - Perceptually uniform color system

## 🚢 Deployment

Ready for deployment on Cloudflare Workers:

```bash
# Build for production
pnpm build

# Deploy to Cloudflare
pnpm wrangler deploy
```

## 📝 Notes

- Uses Tailwind CSS 4 with Vite plugin
- RedwoodJS SDK provides SSR/edge rendering
- All components use semantic color tokens
- Theme system integrated with next-themes
