// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react'
import type React from 'react'
import { isSemanticToken, createSemanticSwitchStyles } from '../theme/index'
import { cn } from '../utils/cn'

export function CatalystSwitchGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="control"
      {...props}
      className={cn(
        // Basic groups
        'space-y-3 **:data-[slot=label]:font-normal',
        // With descriptions
        'has-data-[slot=description]:space-y-6 has-data-[slot=description]:**:data-[slot=label]:font-medium',
        className
      )}
    />
  )
}

export function CatalystSwitchField({
  className,
  ...props
}: { className?: string } & Omit<Headless.FieldProps, 'as' | 'className'>) {
  return (
    <Headless.Field
      data-slot="field"
      {...props}
      className={cn(
        // Base layout
        'grid grid-cols-[1fr_auto] gap-x-8 gap-y-1 sm:grid-cols-[1fr_auto]',
        // Control layout
        '*:data-[slot=control]:col-start-2 *:data-[slot=control]:self-start sm:*:data-[slot=control]:mt-0.5',
        // Label layout
        '*:data-[slot=label]:col-start-1 *:data-[slot=label]:row-start-1',
        // Description layout
        '*:data-[slot=description]:col-start-1 *:data-[slot=description]:row-start-2',
        // With description
        'has-data-[slot=description]:**:data-[slot=label]:font-medium',
        className
      )}
    />
  )
}

const colors = {
  'dark/zinc': [
    '[--switch-bg-ring:var(--color-foreground)]/90 [--switch-bg:var(--color-foreground)] dark:[--switch-bg-ring:transparent] dark:[--switch-bg:var(--color-background)]/25',
    '[--switch-ring:var(--color-foreground)]/90 [--switch-shadow:var(--color-black)]/10 [--switch:white] dark:[--switch-ring:var(--color-muted-foreground)]/90',
  ],
  'dark/white': [
    '[--switch-bg-ring:var(--color-foreground)]/90 [--switch-bg:var(--color-foreground)] dark:[--switch-bg-ring:transparent] dark:[--switch-bg:var(--color-background)]',
    '[--switch-ring:var(--color-foreground)]/90 [--switch-shadow:var(--color-black)]/10 [--switch:white] dark:[--switch-ring:transparent] dark:[--switch:var(--color-foreground)]',
  ],
  dark: [
    '[--switch-bg-ring:var(--color-foreground)]/90 [--switch-bg:var(--color-foreground)] dark:[--switch-bg-ring:var(--color-background)]/15',
    '[--switch-ring:var(--color-foreground)]/90 [--switch-shadow:var(--color-black)]/10 [--switch:white]',
  ],
  zinc: [
    '[--switch-bg-ring:var(--color-muted-foreground)]/90 [--switch-bg:var(--color-muted-foreground)] dark:[--switch-bg-ring:transparent]',
    '[--switch-shadow:var(--color-black)]/10 [--switch:white] [--switch-ring:var(--color-muted-foreground)]/90',
  ],
  white: [
    '[--switch-bg-ring:var(--color-black)]/15 [--switch-bg:white] dark:[--switch-bg-ring:transparent]',
    '[--switch-shadow:var(--color-black)]/10 [--switch-ring:transparent] [--switch:var(--color-foreground)]',
  ],
  red: [
    '[--switch-bg-ring:var(--color-red-700)]/90 [--switch-bg:var(--color-red-600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-red-700)]/90 [--switch-shadow:var(--color-red-900)]/20',
  ],
  orange: [
    '[--switch-bg-ring:var(--color-orange-600)]/90 [--switch-bg:var(--color-orange-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-orange-600)]/90 [--switch-shadow:var(--color-orange-900)]/20',
  ],
  amber: [
    '[--switch-bg-ring:var(--color-amber-500)]/80 [--switch-bg:var(--color-amber-400)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-amber-950)]',
  ],
  yellow: [
    '[--switch-bg-ring:var(--color-yellow-400)]/80 [--switch-bg:var(--color-yellow-300)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-yellow-950)]',
  ],
  lime: [
    '[--switch-bg-ring:var(--color-lime-400)]/80 [--switch-bg:var(--color-lime-300)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-lime-950)]',
  ],
  green: [
    '[--switch-bg-ring:var(--color-green-700)]/90 [--switch-bg:var(--color-green-600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-green-700)]/90 [--switch-shadow:var(--color-green-900)]/20',
  ],
  emerald: [
    '[--switch-bg-ring:var(--color-emerald-600)]/90 [--switch-bg:var(--color-emerald-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-emerald-600)]/90 [--switch-shadow:var(--color-emerald-900)]/20',
  ],
  teal: [
    '[--switch-bg-ring:var(--color-teal-700)]/90 [--switch-bg:var(--color-teal-600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-teal-700)]/90 [--switch-shadow:var(--color-teal-900)]/20',
  ],
  cyan: [
    '[--switch-bg-ring:var(--color-cyan-400)]/80 [--switch-bg:var(--color-cyan-300)] dark:[--switch-bg-ring:transparent]',
    '[--switch-ring:transparent] [--switch-shadow:transparent] [--switch:var(--color-cyan-950)]',
  ],
  sky: [
    '[--switch-bg-ring:var(--color-sky-600)]/80 [--switch-bg:var(--color-sky-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-sky-600)]/80 [--switch-shadow:var(--color-sky-900)]/20',
  ],
  blue: [
    '[--switch-bg-ring:var(--color-blue-700)]/90 [--switch-bg:var(--color-blue-600)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-blue-700)]/90 [--switch-shadow:var(--color-blue-900)]/20',
  ],
  indigo: [
    '[--switch-bg-ring:var(--color-indigo-600)]/90 [--switch-bg:var(--color-indigo-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-indigo-600)]/90 [--switch-shadow:var(--color-indigo-900)]/20',
  ],
  violet: [
    '[--switch-bg-ring:var(--color-violet-600)]/90 [--switch-bg:var(--color-violet-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-violet-600)]/90 [--switch-shadow:var(--color-violet-900)]/20',
  ],
  purple: [
    '[--switch-bg-ring:var(--color-purple-600)]/90 [--switch-bg:var(--color-purple-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-purple-600)]/90 [--switch-shadow:var(--color-purple-900)]/20',
  ],
  fuchsia: [
    '[--switch-bg-ring:var(--color-fuchsia-600)]/90 [--switch-bg:var(--color-fuchsia-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-fuchsia-600)]/90 [--switch-shadow:var(--color-fuchsia-900)]/20',
  ],
  pink: [
    '[--switch-bg-ring:var(--color-pink-600)]/90 [--switch-bg:var(--color-pink-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-pink-600)]/90 [--switch-shadow:var(--color-pink-900)]/20',
  ],
  rose: [
    '[--switch-bg-ring:var(--color-rose-600)]/90 [--switch-bg:var(--color-rose-500)] dark:[--switch-bg-ring:transparent]',
    '[--switch:white] [--switch-ring:var(--color-rose-600)]/90 [--switch-shadow:var(--color-rose-900)]/20',
  ],
  // Semantic token variants
  primary: [
    '[--switch-bg-ring:var(--primary)]/90 [--switch-bg:var(--primary)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--primary-foreground)] [--switch-ring:var(--primary)]/90 [--switch-shadow:var(--primary)]/20',
  ],
  secondary: [
    '[--switch-bg-ring:var(--secondary)]/90 [--switch-bg:var(--secondary)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--secondary-foreground)] [--switch-ring:var(--secondary)]/90 [--switch-shadow:var(--secondary)]/20',
  ],
  accent: [
    '[--switch-bg-ring:var(--accent)]/90 [--switch-bg:var(--accent)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--accent-foreground)] [--switch-ring:var(--accent)]/90 [--switch-shadow:var(--accent)]/20',
  ],
  destructive: [
    '[--switch-bg-ring:var(--destructive)]/90 [--switch-bg:var(--destructive)] dark:[--switch-bg-ring:transparent]',
    '[--switch:var(--destructive-foreground)] [--switch-ring:var(--destructive)]/90 [--switch-shadow:var(--destructive)]/20',
  ],
}

type Color = keyof typeof colors

export function CatalystSwitch({
  color = 'dark/zinc',
  className,
  ...props
}: {
  color?: Color
  className?: string
} & Omit<Headless.SwitchProps, 'as' | 'className' | 'children'>) {
  const resolvedColorClasses = (() => {
    if (color && isSemanticToken(color)) {
      return createSemanticSwitchStyles(color)
    }

    return colors[color] || colors['dark/zinc']
  })()

  return (
    <Headless.Switch
      data-slot="control"
      {...props}
      className={cn(
        // Base styles
        'group relative isolate inline-flex h-6 w-10 cursor-default rounded-full p-[3px] sm:h-5 sm:w-8',
        // Transitions
        'transition duration-0 ease-in-out data-changing:duration-200',
        // Outline and background color in forced-colors mode so switch is still visible
        'forced-colors:outline forced-colors:[--switch-bg:Highlight] dark:forced-colors:[--switch-bg:Highlight]',
        // Unchecked
        'bg-zinc-200 ring-1 ring-black/5 ring-inset dark:bg-muted dark:ring-ring',
        // Checked
        'data-checked:bg-(--switch-bg) data-checked:ring-(--switch-bg-ring) dark:data-checked:bg-(--switch-bg) dark:data-checked:ring-(--switch-bg-ring)',
        // Focus
        'focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-primary',
        // Hover
        'data-hover:ring-black/15 data-hover:data-checked:ring-(--switch-bg-ring)',
        'dark:data-hover:ring-white/25 dark:data-hover:data-checked:ring-(--switch-bg-ring)',
        // Disabled
        'data-disabled:bg-zinc-200 data-disabled:opacity-50 data-disabled:data-checked:bg-zinc-200 data-disabled:data-checked:ring-black/5',
        'dark:data-disabled:bg-white/15 dark:data-disabled:data-checked:bg-white/15 dark:data-disabled:data-checked:ring-white/15',
        resolvedColorClasses,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          // Basic layout
          'pointer-events-none relative inline-block size-4.5 rounded-full sm:size-3.5',
          // Transition
          'translate-x-0 transition duration-200 ease-in-out',
          // Invisible border so the switch is still visible in forced-colors mode
          'border border-transparent',
          // Unchecked
          'bg-white shadow-sm ring-1 ring-black/5',
          // Checked
          'group-data-checked:bg-(--switch) group-data-checked:shadow-(--switch-shadow) group-data-checked:ring-(--switch-ring)',
          'group-data-checked:translate-x-4 sm:group-data-checked:translate-x-3',
          // Disabled
          'group-data-checked:group-data-disabled:bg-white group-data-checked:group-data-disabled:shadow-sm group-data-checked:group-data-disabled:ring-muted/50'
        )}
      />
    </Headless.Switch>
  )
}
