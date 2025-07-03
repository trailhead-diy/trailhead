/**
 * Catalyst Theme with Full Enhanced Variables
 *
 * This theme provides 1:1 visual parity with the original Catalyst UI
 * by including all enhanced semantic tokens with exact zinc color mappings.
 */

import { type TrailheadThemeConfig } from './config';

/**
 * Create the Catalyst theme with all enhanced variables for perfect 1:1 parity
 */
export function createCatalystTheme(): TrailheadThemeConfig {
  return {
    name: 'Catalyst',
    light: {
      // Required shadcn variables
      background: 'oklch(1 0 0)', // white
      foreground: 'oklch(0.1136 0.013 265.626)', // zinc-950
      card: 'oklch(1 0 0)', // white
      'card-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      popover: 'oklch(1 0 0)', // white
      'popover-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      primary: 'oklch(0.6 0.16 240)', // blue-500
      'primary-foreground': 'oklch(1 0 0)', // white
      secondary: 'oklch(0.965 0.003 264.542)', // zinc-100
      'secondary-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      muted: 'oklch(0.965 0.003 264.542)', // zinc-100
      'muted-foreground': 'oklch(0.577 0.012 264.394)', // zinc-500
      accent: 'oklch(0.965 0.003 264.542)', // zinc-100
      'accent-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      destructive: 'oklch(0.577 0.245 27.325)', // red-600
      'destructive-foreground': 'oklch(1 0 0)', // white
      border: 'oklch(0.9221 0.006 264.531)', // zinc-200
      input: 'oklch(0.9221 0.006 264.531)', // zinc-200
      ring: 'oklch(0.6 0.16 240)', // blue-500

      // Chart colors
      'chart-1': 'oklch(0.6 0.16 240)', // blue
      'chart-2': 'oklch(0.488 0.243 264.376)', // violet
      'chart-3': 'oklch(0.627 0.17 149.2)', // teal
      'chart-4': 'oklch(0.828 0.189 84.429)', // lime
      'chart-5': 'oklch(0.577 0.245 27.325)', // red

      // Sidebar colors
      sidebar: 'oklch(1 0 0)', // white
      'sidebar-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'sidebar-primary': 'oklch(0.6 0.16 240)', // blue-500
      'sidebar-primary-foreground': 'oklch(1 0 0)', // white
      'sidebar-accent': 'oklch(0.965 0.003 264.542)', // zinc-100
      'sidebar-accent-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'sidebar-border': 'oklch(0.9221 0.006 264.531)', // zinc-200
      'sidebar-ring': 'oklch(0.6 0.16 240)', // blue-500

      // Enhanced hierarchical text tokens
      'tertiary-foreground': 'oklch(0.5 0.013 264.401)', // zinc-600
      'quaternary-foreground': 'oklch(0.577 0.012 264.394)', // zinc-500

      // Enhanced icon state tokens
      'icon-primary': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'icon-secondary': 'oklch(0.2691 0.013 265.643)', // zinc-700
      'icon-inactive': 'oklch(0.577 0.012 264.394)', // zinc-500
      'icon-active': 'oklch(0.2691 0.013 265.643)', // zinc-700
      'icon-hover': 'oklch(0.788 0.01 264.359)', // zinc-300
      'icon-muted': 'oklch(0.694 0.013 264.378)', // zinc-400

      // Enhanced border weight tokens
      'border-strong': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'border-subtle': 'oklch(0.1136 0.013 265.626 / 0.1)', // zinc-950/10
      'border-ghost': 'oklch(0.1136 0.013 265.626 / 0.05)', // zinc-950/5

      // Component-specific tokens
      'sidebar-text-primary': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'sidebar-text-secondary': 'oklch(0.577 0.012 264.394)', // zinc-500
      'sidebar-icon-default': 'oklch(0.577 0.012 264.394)', // zinc-500
      'sidebar-icon-active': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'table-header-text': 'oklch(0.577 0.012 264.394)', // zinc-500
      'table-body-text': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'button-text-default': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'button-text-hover': 'oklch(0.1136 0.013 265.626)', // zinc-950
    },
    dark: {
      // Required shadcn variables
      background: 'oklch(0.1136 0.013 265.626)', // zinc-950
      foreground: 'oklch(0.985 0.002 264.52)', // zinc-50
      card: 'oklch(0.1887 0.015 265.729)', // zinc-900
      'card-foreground': 'oklch(0.985 0.002 264.52)', // zinc-50
      popover: 'oklch(0.1887 0.015 265.729)', // zinc-900
      'popover-foreground': 'oklch(0.985 0.002 264.52)', // zinc-50
      primary: 'oklch(0.7 0.14 240)', // blue-400
      'primary-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      secondary: 'oklch(0.2691 0.013 265.643)', // zinc-800
      'secondary-foreground': 'oklch(0.985 0.002 264.52)', // zinc-50
      muted: 'oklch(0.2691 0.013 265.643)', // zinc-800
      'muted-foreground': 'oklch(0.694 0.013 264.378)', // zinc-400
      accent: 'oklch(0.2691 0.013 265.643)', // zinc-800
      'accent-foreground': 'oklch(0.985 0.002 264.52)', // zinc-50
      destructive: 'oklch(0.704 0.191 22.216)', // red-500
      'destructive-foreground': 'oklch(0.985 0.002 264.52)', // zinc-50
      border: 'oklch(1 0 0 / 0.15)', // white/15%
      input: 'oklch(1 0 0 / 0.15)', // white/15%
      ring: 'oklch(0.7 0.14 240)', // blue-400

      // Chart colors
      'chart-1': 'oklch(0.488 0.243 264.376)', // violet
      'chart-2': 'oklch(0.696 0.17 162.48)', // green
      'chart-3': 'oklch(0.769 0.188 70.08)', // amber
      'chart-4': 'oklch(0.627 0.265 303.9)', // purple
      'chart-5': 'oklch(0.645 0.246 16.439)', // red

      // Sidebar colors
      sidebar: 'oklch(0.1887 0.015 265.729)', // zinc-900
      'sidebar-foreground': 'oklch(0.985 0.002 264.52)', // zinc-50
      'sidebar-primary': 'oklch(0.7 0.14 240)', // blue-400
      'sidebar-primary-foreground': 'oklch(0.1136 0.013 265.626)', // zinc-950
      'sidebar-accent': 'oklch(0.2691 0.013 265.643)', // zinc-800
      'sidebar-accent-foreground': 'oklch(0.985 0.002 264.52)', // zinc-50
      'sidebar-border': 'oklch(1 0 0 / 0.15)', // white/15%
      'sidebar-ring': 'oklch(0.7 0.14 240)', // blue-400

      // Enhanced hierarchical text tokens
      'tertiary-foreground': 'oklch(0.694 0.013 264.378)', // zinc-400
      'quaternary-foreground': 'oklch(0.577 0.012 264.394)', // zinc-500

      // Enhanced icon state tokens
      'icon-primary': 'oklch(0.985 0.002 264.52)', // zinc-50
      'icon-secondary': 'oklch(0.788 0.01 264.359)', // zinc-300
      'icon-inactive': 'oklch(0.577 0.012 264.394)', // zinc-500
      'icon-active': 'oklch(0.788 0.01 264.359)', // zinc-300
      'icon-hover': 'oklch(0.694 0.013 264.378)', // zinc-400
      'icon-muted': 'oklch(0.5 0.013 264.401)', // zinc-600

      // Enhanced border weight tokens
      'border-strong': 'oklch(0.985 0.002 264.52)', // zinc-50
      'border-subtle': 'oklch(1 0 0 / 0.1)', // white/10%
      'border-ghost': 'oklch(1 0 0 / 0.05)', // white/5%

      // Component-specific tokens
      'sidebar-text-primary': 'oklch(0.985 0.002 264.52)', // zinc-50
      'sidebar-text-secondary': 'oklch(0.694 0.013 264.378)', // zinc-400
      'sidebar-icon-default': 'oklch(0.577 0.012 264.394)', // zinc-500
      'sidebar-icon-active': 'oklch(0.985 0.002 264.52)', // zinc-50
      'table-header-text': 'oklch(0.694 0.013 264.378)', // zinc-400
      'table-body-text': 'oklch(0.985 0.002 264.52)', // zinc-50
      'button-text-default': 'oklch(0.985 0.002 264.52)', // zinc-50
      'button-text-hover': 'oklch(0.985 0.002 264.52)', // zinc-50
    },
  };
}
