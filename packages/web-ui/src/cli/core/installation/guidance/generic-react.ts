/**
 * Generic React guidance
 */

import type { FrameworkInfo } from '../framework-detection.js';
import type { FrameworkGuidance, ConfigTemplate } from './types.js';
import {
  generateCSSCustomProperties,
  generateThemeProviderUsage,
  generateTailwindColors,
  generateTailwindBorderRadius,
} from './shared.js';

// ============================================================================
// GENERIC REACT GUIDANCE
// ============================================================================

/**
 * Pure function: Generate generic React guidance
 */
export const generateGenericReactGuidance = (framework: FrameworkInfo): FrameworkGuidance => ({
  framework,
  steps: [
    {
      title: 'Add CSS custom properties',
      description: 'Add the Trailhead UI theme variables to your main CSS file',
      filename: 'src/index.css or src/App.css',
      language: 'css',
      code: generateCSSCustomProperties(),
    },
    {
      title: 'Wrap your app with ThemeProvider',
      description: 'Add ThemeProvider to your app root',
      filename: 'src/App.tsx or src/index.tsx',
      language: 'tsx',
      code: generateThemeProviderUsage(),
    },
    {
      title: 'Configure Tailwind CSS (if not already configured)',
      description: 'Make sure Tailwind CSS is properly configured to use the semantic tokens',
      filename: 'tailwind.config.js',
      language: 'ts',
      optional: true,
      code: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
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
        // ... other colors
      },
    },
  },
  plugins: [],
}`,
    },
  ],
  notes: [
    'This is the generic React setup - adapt the file paths to your project structure',
    'Make sure to import your CSS file in your main component or index file',
    'The exact integration depends on your build tool and setup',
  ],
  troubleshooting: [
    'Check that your CSS file is properly imported and loaded',
    'Make sure Tailwind CSS is configured to scan your component files',
    'Verify that the ThemeProvider is wrapping your entire app',
  ],
});

// ============================================================================
// GENERIC REACT CONFIG TEMPLATES
// ============================================================================

/**
 * Generate generic React Tailwind config template
 */
export const generateGenericReactTailwindConfig = (): ConfigTemplate => ({
  filename: 'tailwind.config.js',
  description: 'Tailwind CSS configuration with Trailhead UI semantic tokens',
  content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
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
});

/**
 * Generate generic React CSS template
 */
export const generateGenericReactCSSTemplate = (): ConfigTemplate => ({
  filename: 'src/index.css',
  description: 'CSS file with Trailhead UI theme variables',
  content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
${generateCSSCustomProperties()}
}`,
});
