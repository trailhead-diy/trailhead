/**
 * Vite-specific guidance
 */

import type { FrameworkInfo } from '../framework-detection.js'
import type { FrameworkGuidance, ConfigTemplate } from './types.js'
import { generateCSSCustomProperties, generateTailwindColors, generateTailwindBorderRadius } from './shared.js'

// ============================================================================
// VITE GUIDANCE
// ============================================================================

/**
 * Pure function: Generate Vite-specific guidance
 */
export const generateViteGuidance = (framework: FrameworkInfo): FrameworkGuidance => ({
  framework,
  steps: [
    {
      title: 'Add CSS custom properties to index.css',
      description: 'Add the Trailhead UI theme variables to your main CSS file',
      filename: 'src/index.css',
      language: 'css',
      code: `@tailwind base;
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
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}`,
    },
    {
      title: 'Update tailwind.config.js',
      description: 'Add the semantic color tokens to your Tailwind configuration',
      filename: 'tailwind.config.js',
      language: 'ts',
      code: `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}`,
    },
    {
      title: 'Wrap your app with ThemeProvider',
      description: 'Add ThemeProvider to your main.tsx',
      filename: 'src/main.tsx',
      language: 'tsx',
      code: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)`,
    },
  ],
  notes: [
    'Vite uses ES modules by default - make sure to use export default in tailwind.config.js',
    'The index.html file is in the root directory, not in src/',
    'Make sure to import your CSS file in main.tsx',
  ],
  troubleshooting: [
    'If path aliases are not working, add them to vite.config.ts and tsconfig.json',
    'Make sure tailwindcss and autoprefixer are installed as dev dependencies',
    'Check that your CSS file is properly imported in main.tsx',
  ],
})

// ============================================================================
// VITE CONFIG TEMPLATES
// ============================================================================

/**
 * Generate Vite Tailwind config template
 */
export const generateViteTailwindConfig = (): ConfigTemplate => ({
  filename: 'tailwind.config.js',
  description: 'Tailwind CSS configuration with Trailhead UI semantic tokens for Vite',
  content: `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: ${JSON.stringify(generateTailwindColors(), null, 6).replace(/\n/g, '\n      ')},
      borderRadius: ${JSON.stringify(generateTailwindBorderRadius(), null, 6).replace(/\n/g, '\n      ')},
    },
  },
  plugins: [],
}`,
})

/**
 * Generate Vite CSS template
 */
export const generateViteCSSTemplate = (): ConfigTemplate => ({
  filename: 'src/index.css',
  description: 'CSS file with Trailhead UI theme variables for Vite',
  content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
${generateCSSCustomProperties()}

  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}`
})