/**
 * RedwoodSDK-specific guidance
 */

import type { FrameworkInfo } from '../framework-detection.js'
import type { FrameworkGuidance } from './types.js'

// ============================================================================
// REDWOOD SDK GUIDANCE
// ============================================================================

/**
 * Pure function: Generate RedwoodSDK-specific guidance
 */
export const generateRedwoodSDKGuidance = (framework: FrameworkInfo): FrameworkGuidance => ({
  framework,
  steps: [
    {
      title: 'Add CSS custom properties to styles.css',
      description:
        'Add the theme system to your main styles.css file using the @theme block pattern',
      filename: 'src/styles.css',
      language: 'css',
      code: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  /* Your existing theme variables */
  --font-body: "Inter", sans-serif;
  
  /* Trailhead UI semantic tokens */
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-primary: 222.2 47.4% 11.2%;
  --color-primary-foreground: 210 40% 98%;
  --color-secondary: 210 40% 96%;
  --color-secondary-foreground: 222.2 84% 4.9%;
  --color-muted: 210 40% 96%;
  --color-muted-foreground: 215.4 16.3% 46.9%;
  --color-accent: 210 40% 96%;
  --color-accent-foreground: 222.2 84% 4.9%;
  --color-destructive: 0 84.2% 60.2%;
  --color-destructive-foreground: 210 40% 98%;
  --color-border: 214.3 31.8% 91.4%;
  --color-input: 214.3 31.8% 91.4%;
  --color-ring: 222.2 84% 4.9%;
  
  --radius: 0.5rem;
}

@layer base {
  body {
    @apply bg-background text-foreground font-body;
  }
}`,
    },
    {
      title: 'Add dark mode support',
      description: 'Add dark mode variants to your styles.css',
      filename: 'src/styles.css',
      language: 'css',
      code: `/* Add this to your existing styles.css after the @theme block */

@custom-variant dark (&:is(.dark *));

.dark {
  --color-background: 222.2 84% 4.9%;
  --color-foreground: 210 40% 98%;
  --color-primary: 210 40% 98%;
  --color-primary-foreground: 222.2 84% 4.9%;
  --color-secondary: 217.2 32.6% 17.5%;
  --color-secondary-foreground: 210 40% 98%;
  --color-muted: 217.2 32.6% 17.5%;
  --color-muted-foreground: 215 20.2% 65.1%;
  --color-accent: 217.2 32.6% 17.5%;
  --color-accent-foreground: 210 40% 98%;
  --color-destructive: 0 62.8% 30.6%;
  --color-destructive-foreground: 210 40% 98%;
  --color-border: 217.2 32.6% 17.5%;
  --color-input: 217.2 32.6% 17.5%;
  --color-ring: 212.7 26.8% 83.9%;
}`,
    },
    {
      title: 'Wrap your app with ThemeProvider',
      description: 'Add ThemeProvider to your main layout or app wrapper',
      filename: 'src/app/layout.tsx or src/App.tsx',
      language: 'tsx',
      code: `import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}`,
    },
    {
      title: 'Add theme switcher (optional)',
      description: 'Add a theme switcher component to allow users to change themes',
      filename: 'src/components/theme-switcher-demo.tsx',
      language: 'tsx',
      optional: true,
      code: `import { ThemeSwitcher } from '@/components/theme-switcher'

export function ThemeSwitcherDemo() {
  return (
    <div className="flex items-center gap-2">
      <span>Theme:</span>
      <ThemeSwitcher />
    </div>
  )
}`,
    },
  ],
  notes: [
    'RedwoodSDK uses Tailwind v4 with @theme blocks - this is the recommended approach',
    'CSS custom properties are automatically available as Tailwind colors (bg-background, text-primary, etc.)',
    'The @custom-variant dark pattern is specific to RedwoodSDK for dark mode support',
  ],
  troubleshooting: [
    'If colors are not working, make sure @import "tailwindcss" comes before your @theme block',
    'Check that your CSS file is properly imported in your app',
    'Verify that the @custom-variant dark is correctly defined for dark mode',
  ],
})

// ============================================================================
// REDWOOD SDK CONFIG TEMPLATES
// ============================================================================

/**
 * Generate RedwoodSDK CSS template
 */
export const generateRedwoodSDKCSSTemplate = () => ({
  filename: 'src/styles.css',
  description: 'CSS file with Trailhead UI theme variables for RedwoodSDK',
  content: `@import "tailwindcss";

@theme {
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-primary: 222.2 47.4% 11.2%;
  --color-primary-foreground: 210 40% 98%;
  --color-secondary: 210 40% 96%;
  --color-secondary-foreground: 222.2 84% 4.9%;
  --color-muted: 210 40% 96%;
  --color-muted-foreground: 215.4 16.3% 46.9%;
  --color-accent: 210 40% 96%;
  --color-accent-foreground: 222.2 84% 4.9%;
  --color-destructive: 0 84.2% 60.2%;
  --color-destructive-foreground: 210 40% 98%;
  --color-border: 214.3 31.8% 91.4%;
  --color-input: 214.3 31.8% 91.4%;
  --color-ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

@custom-variant dark (&:is(.dark *));

.dark {
  --color-background: 222.2 84% 4.9%;
  --color-foreground: 210 40% 98%;
  --color-primary: 210 40% 98%;
  --color-primary-foreground: 222.2 84% 4.9%;
  --color-secondary: 217.2 32.6% 17.5%;
  --color-secondary-foreground: 210 40% 98%;
  --color-muted: 217.2 32.6% 17.5%;
  --color-muted-foreground: 215 20.2% 65.1%;
  --color-accent: 217.2 32.6% 17.5%;
  --color-accent-foreground: 210 40% 98%;
  --color-destructive: 0 62.8% 30.6%;
  --color-destructive-foreground: 210 40% 98%;
  --color-border: 217.2 32.6% 17.5%;
  --color-input: 217.2 32.6% 17.5%;
  --color-ring: 212.7 26.8% 83.9%;
}`,
})