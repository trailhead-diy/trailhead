/**
 * Interactive state color mappings
 * Transforms hover, focus, active, and other interactive state colors
 */

import { createRegexTransform, type ColorMapping } from '../utilities/regex-transform-factory.js'

// Focus rings and outlines
const FOCUS_COLORS: ColorMapping[] = [
  {
    pattern: /ring-blue-500/g,
    replacement: 'ring-primary',
    description: 'ring-blue-500 → ring-primary (theme-aware focus)',
  },
  {
    pattern: /outline-blue-500/g,
    replacement: 'outline-primary',
    description: 'outline-blue-500 → outline-primary (theme-aware focus)',
  },
  {
    pattern: /data-focus:bg-blue-500/g,
    replacement: 'data-focus:bg-primary',
    description: 'data-focus:bg-blue-500 → data-focus:bg-primary (theme-aware dropdown)',
  },
  {
    pattern: /sm:focus-within:after:ring-blue-500/g,
    replacement: 'sm:focus-within:after:ring-primary',
    description: 'sm:focus-within:after:ring-blue-500 → sm:focus-within:after:ring-primary',
  },
  {
    pattern: /focus-within:after:ring-blue-500/g,
    replacement: 'focus-within:after:ring-primary',
    description: 'focus-within:after:ring-blue-500 → focus-within:after:ring-primary',
  },
  {
    pattern: /focus-visible:ring-blue-500/g,
    replacement: 'focus-visible:ring-primary',
    description: 'focus-visible:ring-blue-500 → focus-visible:ring-primary',
  },
  {
    pattern: /data-focus:outline-blue-500/g,
    replacement: 'data-focus:outline-primary',
    description: 'data-focus:outline-blue-500 → data-focus:outline-primary',
  },
  {
    pattern: /data-focus:ring-zinc-950\/(\d+(?:\.\d+)?)/g,
    replacement: 'data-focus:ring-ring',
    description: 'data-focus:ring-zinc-950/opacity → data-focus:ring-ring (focus state)',
  },
]

// Hover States
const HOVER_STATES: ColorMapping[] = [
  {
    pattern: /data-hover:bg-zinc-950\/(\d+(?:\.\d+)?)/g,
    replacement: 'data-hover:bg-accent',
    description: 'data-hover:bg-zinc-950/opacity → data-hover:bg-accent (hover state)',
  },
  {
    pattern: /data-hover:bg-white\/(\d+(?:\.\d+)?)/g,
    replacement: 'data-hover:bg-accent',
    description: 'data-hover:bg-white/opacity → data-hover:bg-accent (hover state)',
  },
  {
    pattern: /data-hover:text-zinc-950/g,
    replacement: 'data-hover:text-accent-foreground',
    description: 'data-hover:text-zinc-950 → data-hover:text-accent-foreground (hover text)',
  },
]

// Active States
const ACTIVE_STATES: ColorMapping[] = [
  {
    pattern: /data-active:bg-zinc-950\/(\d+(?:\.\d+)?)/g,
    replacement: 'data-active:bg-muted',
    description: 'data-active:bg-zinc-950/opacity → data-active:bg-muted (active state)',
  },
]

// Icon fill states with interactive modifiers
const ICON_FILL_STATES: ColorMapping[] = [
  // Light mode icon fills with state modifiers
  {
    pattern: /data-hover:\*:data-\[slot=icon\]:fill-zinc-950/g,
    replacement: 'data-hover:*:data-[slot=icon]:fill-foreground',
    description: 'data-hover icon fill-zinc-950 → fill-foreground',
  },
  {
    pattern: /data-active:\*:data-\[slot=icon\]:fill-zinc-950/g,
    replacement: 'data-active:*:data-[slot=icon]:fill-foreground',
    description: 'data-active icon fill-zinc-950 → fill-foreground',
  },
  {
    pattern: /data-current:\*:data-\[slot=icon\]:fill-zinc-950/g,
    replacement: 'data-current:*:data-[slot=icon]:fill-foreground',
    description: 'data-current icon fill-zinc-950 → fill-foreground',
  },
  // Dark mode icon fills with state modifiers
  {
    pattern: /dark:data-hover:\*:data-\[slot=icon\]:fill-white/g,
    replacement: 'dark:data-hover:*:data-[slot=icon]:fill-foreground',
    description: 'dark hover icon fill-white → fill-foreground',
  },
  {
    pattern: /dark:data-active:\*:data-\[slot=icon\]:fill-white/g,
    replacement: 'dark:data-active:*:data-[slot=icon]:fill-foreground',
    description: 'dark active icon fill-white → fill-foreground',
  },
  {
    pattern: /dark:data-current:\*:data-\[slot=icon\]:fill-white/g,
    replacement: 'dark:data-current:*:data-[slot=icon]:fill-foreground',
    description: 'dark current icon fill-white → fill-foreground',
  },
]

/**
 * Interactive states color transform
 * Created using regex transform factory for DRY implementation
 */
export const interactiveStatesTransform = createRegexTransform({
  name: 'interactive-states-colors',
  description: 'Transform interactive state colors to semantic tokens',
  mappings: [
    ...FOCUS_COLORS,
    ...HOVER_STATES,
    ...ACTIVE_STATES,
    ...ICON_FILL_STATES,
  ],
  changeType: 'interactive-color',
})