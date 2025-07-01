/**
 * Next.js-specific guidance
 */

import type { FrameworkInfo } from '../framework-detection.js'
import type { FrameworkGuidance, ConfigTemplate } from './types.js'
import { generateCSSCustomProperties, generateTailwindColors, generateTailwindBorderRadius } from './shared.js'

// ============================================================================
// NEXT.JS GUIDANCE
// ============================================================================

/**
 * Pure function: Generate Next.js-specific guidance
 */
export const generateNextJSGuidance = (framework: FrameworkInfo): FrameworkGuidance => ({
  framework,
  steps: [
    {
      title: 'Add CSS custom properties to globals.css',
      description: 'Add the Trailhead UI theme variables to your global CSS file',
      filename: 'app/globals.css or styles/globals.css',
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
  }
}`,
    },
    {
      title: 'Update tailwind.config.js',
      description: 'Add the semantic color tokens to your Tailwind configuration',
      filename: 'tailwind.config.js',
      language: 'ts',
      code: `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
  plugins: [require("tailwindcss-animate")],
}`,
    },
    {
      title: 'Wrap your app with ThemeProvider (App Router)',
      description: 'For Next.js 13+ App Router, add ThemeProvider to your root layout',
      filename: 'app/layout.tsx',
      language: 'tsx',
      code: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}`,
    },
    {
      title: 'Wrap your app with ThemeProvider (Pages Router)',
      description: 'For Next.js Pages Router, add ThemeProvider to your _app.tsx',
      filename: 'pages/_app.tsx',
      language: 'tsx',
      optional: true,
      code: `import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}`,
    },
  ],
  notes: [
    'Next.js requires CSS custom properties to be wrapped with hsl() in the Tailwind config',
    'App Router is recommended for new projects (uses app/layout.tsx)',
    'Pages Router uses pages/_app.tsx for the theme provider',
  ],
  troubleshooting: [
    'If using App Router, make sure to import globals.css in app/layout.tsx',
    'If using Pages Router, make sure to import globals.css in pages/_app.tsx',
    'Check that tailwindcss-animate is installed if using animation classes',
  ],
})

// ============================================================================
// NEXT.JS CONFIG TEMPLATES
// ============================================================================

/**
 * Generate Next.js Tailwind config template
 */
export const generateNextJSTailwindConfig = (): ConfigTemplate => ({
  filename: 'tailwind.config.js',
  description: 'Tailwind CSS configuration with Trailhead UI semantic tokens for Next.js',
  content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
 * Generate Next.js CSS template
 */
export const generateNextJSCSSTemplate = (): ConfigTemplate => ({
  filename: 'app/globals.css',
  description: 'CSS file with Trailhead UI theme variables for Next.js',
  content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
${generateCSSCustomProperties()}
}`
})