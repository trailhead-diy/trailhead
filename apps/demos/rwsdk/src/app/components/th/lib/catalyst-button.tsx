// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'
import { CatalystLink } from './catalyst-link'
// Semantic token imports removed - not used in this component
import { cn } from '../utils/cn'

const styles = {
  base: [
    // Base
    'relative isolate inline-flex items-baseline justify-center gap-x-2 rounded-lg border text-base/6 font-semibold',
    // Sizing
    'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/6',
    // Focus
    'focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-primary',
    // Disabled
    'data-disabled:opacity-50',
    // Icon
    '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:my-0.5 *:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center *:data-[slot=icon]:text-(--btn-icon) sm:*:data-[slot=icon]:my-1 sm:*:data-[slot=icon]:size-4 forced-colors:[--btn-icon:ButtonText] forced-colors:data-hover:[--btn-icon:ButtonText]',
  ],
  solid: [
    // Optical border, implemented as the button background to avoid corner artifacts
    'border-transparent bg-(--btn-border)',
    // Dark mode: border is rendered on `after` so background is set to button background
    'dark:bg-(--btn-bg)',
    // Button background, implemented as foreground layer to stack on top of pseudo-border layer
    'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-lg)-1px)] before:bg-(--btn-bg)',
    // Drop shadow, applied to the inset `before` layer so it blends with the border
    'before:shadow-sm',
    // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
    'dark:before:hidden',
    // Dark mode: Subtle white outline is applied using a border
    'dark:border-border',
    // Shim/overlay, inset to match button foreground and used for hover state + highlight shadow
    'after:absolute after:inset-0 after:-z-10 after:rounded-[calc(var(--radius-lg)-1px)]',
    // Inner highlight shadow
    'after:shadow-[inset_0_1px_--theme(--color-white/15%)]',
    // White overlay on hover
    'data-active:after:bg-(--btn-hover-overlay) data-hover:after:bg-(--btn-hover-overlay)',
    // Dark mode: `after` layer expands to cover entire button
    'dark:after:-inset-px dark:after:rounded-lg',
    // Disabled
    'data-disabled:before:shadow-none data-disabled:after:shadow-none',
  ],
  outline: [
    // Base
    'border-zinc-950/10 text-foreground data-active:bg-muted data-hover:bg-accent',
    // Dark mode
    'dark:border-border dark:text-foreground dark:[--btn-bg:transparent] dark:data-active:bg-muted dark:data-hover:bg-accent',
    // Icon
    '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-muted-foreground)] data-hover:[--btn-icon:var(--color-muted-foreground)] dark:data-active:[--btn-icon:var(--color-muted-foreground)] dark:data-hover:[--btn-icon:var(--color-muted-foreground)]',
  ],
  plain: [
    // Base
    'border-transparent text-foreground data-active:bg-muted data-hover:bg-accent',
    // Dark mode
    'dark:text-foreground dark:data-active:bg-muted dark:data-hover:bg-accent',
    // Icon
    '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-muted-foreground)] data-hover:[--btn-icon:var(--color-muted-foreground)] dark:[--btn-icon:var(--color-muted-foreground)] dark:data-active:[--btn-icon:var(--color-muted-foreground)] dark:data-hover:[--btn-icon:var(--color-muted-foreground)]',
  ],
  colors: {
    'dark/zinc': [
      'text-white [--btn-bg:var(--color-foreground)] [--btn-border:var(--color-foreground)]/90 [--btn-hover-overlay:var(--color-background)]/10',
      'dark:text-foreground dark:[--btn-bg:var(--color-muted-foreground)] dark:[--btn-hover-overlay:var(--color-background)]/5',
      '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-zinc-300)] data-hover:[--btn-icon:var(--color-zinc-300)]',
    ],
    light: [
      'text-foreground [--btn-bg:white] [--btn-border:var(--color-foreground)]/10 [--btn-hover-overlay:var(--color-foreground)]/2.5 data-active:[--btn-border:var(--color-foreground)]/15 data-hover:[--btn-border:var(--color-foreground)]/15',
      'dark:text-foreground dark:[--btn-hover-overlay:var(--color-background)]/5 dark:[--btn-bg:var(--color-button-secondary-bg)]',
      '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-muted-foreground)] data-hover:[--btn-icon:var(--color-muted-foreground)] dark:[--btn-icon:var(--color-muted-foreground)] dark:data-active:[--btn-icon:var(--color-muted-foreground)] dark:data-hover:[--btn-icon:var(--color-muted-foreground)]',
    ],
    'dark/white': [
      'text-white [--btn-bg:var(--color-foreground)] [--btn-border:var(--color-foreground)]/90 [--btn-hover-overlay:var(--color-background)]/10',
      'dark:text-foreground dark:[--btn-bg:white] dark:[--btn-hover-overlay:var(--color-foreground)]/5',
      '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-zinc-300)] data-hover:[--btn-icon:var(--color-zinc-300)] dark:[--btn-icon:var(--color-muted-foreground)] dark:data-active:[--btn-icon:var(--color-muted-foreground)] dark:data-hover:[--btn-icon:var(--color-muted-foreground)]',
    ],
    dark: [
      'text-white [--btn-bg:var(--color-foreground)] [--btn-border:var(--color-foreground)]/90 [--btn-hover-overlay:var(--color-background)]/10',
      'dark:[--btn-hover-overlay:var(--color-background)]/5 dark:[--btn-bg:var(--color-button-secondary-bg)]',
      '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-zinc-300)] data-hover:[--btn-icon:var(--color-zinc-300)]',
    ],
    white: [
      'text-foreground [--btn-bg:white] [--btn-border:var(--color-foreground)]/10 [--btn-hover-overlay:var(--color-foreground)]/2.5 data-active:[--btn-border:var(--color-foreground)]/15 data-hover:[--btn-border:var(--color-foreground)]/15',
      'dark:[--btn-hover-overlay:var(--color-foreground)]/5',
      '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-muted-foreground)] data-hover:[--btn-icon:var(--color-muted-foreground)]',
    ],
    zinc: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-muted-foreground)] [--btn-border:var(--color-muted-foreground)]/90',
      'dark:[--btn-hover-overlay:var(--color-background)]/5',
      '[--btn-icon:var(--color-muted-foreground)] data-active:[--btn-icon:var(--color-zinc-300)] data-hover:[--btn-icon:var(--color-zinc-300)]',
    ],
    indigo: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-indigo-500)] [--btn-border:var(--color-indigo-600)]/90',
      '[--btn-icon:var(--color-indigo-300)] data-active:[--btn-icon:var(--color-indigo-200)] data-hover:[--btn-icon:var(--color-indigo-200)]',
    ],
    cyan: [
      'text-cyan-950 [--btn-bg:var(--color-cyan-300)] [--btn-border:var(--color-cyan-400)]/80 [--btn-hover-overlay:var(--color-background)]/25',
      '[--btn-icon:var(--color-cyan-500)]',
    ],
    red: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-red-600)] [--btn-border:var(--color-red-700)]/90',
      '[--btn-icon:var(--color-red-300)] data-active:[--btn-icon:var(--color-red-200)] data-hover:[--btn-icon:var(--color-red-200)]',
    ],
    orange: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-orange-500)] [--btn-border:var(--color-orange-600)]/90',
      '[--btn-icon:var(--color-orange-300)] data-active:[--btn-icon:var(--color-orange-200)] data-hover:[--btn-icon:var(--color-orange-200)]',
    ],
    amber: [
      'text-amber-950 [--btn-hover-overlay:var(--color-background)]/25 [--btn-bg:var(--color-amber-400)] [--btn-border:var(--color-amber-500)]/80',
      '[--btn-icon:var(--color-amber-600)]',
    ],
    yellow: [
      'text-yellow-950 [--btn-hover-overlay:var(--color-background)]/25 [--btn-bg:var(--color-yellow-300)] [--btn-border:var(--color-yellow-400)]/80',
      '[--btn-icon:var(--color-yellow-600)] data-active:[--btn-icon:var(--color-yellow-700)] data-hover:[--btn-icon:var(--color-yellow-700)]',
    ],
    lime: [
      'text-lime-950 [--btn-hover-overlay:var(--color-background)]/25 [--btn-bg:var(--color-lime-300)] [--btn-border:var(--color-lime-400)]/80',
      '[--btn-icon:var(--color-lime-600)] data-active:[--btn-icon:var(--color-lime-700)] data-hover:[--btn-icon:var(--color-lime-700)]',
    ],
    green: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-green-600)] [--btn-border:var(--color-green-700)]/90',
      '[--btn-icon:var(--color-background)]/60 data-active:[--btn-icon:var(--color-background)]/80 data-hover:[--btn-icon:var(--color-background)]/80',
    ],
    emerald: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-emerald-600)] [--btn-border:var(--color-emerald-700)]/90',
      '[--btn-icon:var(--color-background)]/60 data-active:[--btn-icon:var(--color-background)]/80 data-hover:[--btn-icon:var(--color-background)]/80',
    ],
    teal: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-teal-600)] [--btn-border:var(--color-teal-700)]/90',
      '[--btn-icon:var(--color-background)]/60 data-active:[--btn-icon:var(--color-background)]/80 data-hover:[--btn-icon:var(--color-background)]/80',
    ],
    sky: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-sky-500)] [--btn-border:var(--color-sky-600)]/80',
      '[--btn-icon:var(--color-background)]/60 data-active:[--btn-icon:var(--color-background)]/80 data-hover:[--btn-icon:var(--color-background)]/80',
    ],
    blue: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-blue-600)] [--btn-border:var(--color-blue-700)]/90',
      '[--btn-icon:var(--color-blue-400)] data-active:[--btn-icon:var(--color-blue-300)] data-hover:[--btn-icon:var(--color-blue-300)]',
    ],
    violet: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-violet-500)] [--btn-border:var(--color-violet-600)]/90',
      '[--btn-icon:var(--color-violet-300)] data-active:[--btn-icon:var(--color-violet-200)] data-hover:[--btn-icon:var(--color-violet-200)]',
    ],
    purple: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-purple-500)] [--btn-border:var(--color-purple-600)]/90',
      '[--btn-icon:var(--color-purple-300)] data-active:[--btn-icon:var(--color-purple-200)] data-hover:[--btn-icon:var(--color-purple-200)]',
    ],
    fuchsia: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-fuchsia-500)] [--btn-border:var(--color-fuchsia-600)]/90',
      '[--btn-icon:var(--color-fuchsia-300)] data-active:[--btn-icon:var(--color-fuchsia-200)] data-hover:[--btn-icon:var(--color-fuchsia-200)]',
    ],
    pink: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-pink-500)] [--btn-border:var(--color-pink-600)]/90',
      '[--btn-icon:var(--color-pink-300)] data-active:[--btn-icon:var(--color-pink-200)] data-hover:[--btn-icon:var(--color-pink-200)]',
    ],
    rose: [
      'text-white [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--color-rose-500)] [--btn-border:var(--color-rose-600)]/90',
      '[--btn-icon:var(--color-rose-300)] data-active:[--btn-icon:var(--color-rose-200)] data-hover:[--btn-icon:var(--color-rose-200)]',
    ],
    // Semantic token variants
    primary: [
      'text-primary-foreground [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--primary)] [--btn-border:var(--primary)]/90',
      '[--btn-icon:var(--color-primary-foreground)]/80 data-active:[--btn-icon:var(--color-primary-foreground)] data-hover:[--btn-icon:var(--color-primary-foreground)]',
    ],
    secondary: [
      'text-secondary-foreground [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--secondary)] [--btn-border:var(--secondary)]/90',
      '[--btn-icon:var(--color-secondary-foreground)]/80 data-active:[--btn-icon:var(--color-secondary-foreground)] data-hover:[--btn-icon:var(--color-secondary-foreground)]',
    ],
    accent: [
      'text-accent-foreground [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--accent)] [--btn-border:var(--accent)]/90',
      '[--btn-icon:var(--color-accent-foreground)]/80 data-active:[--btn-icon:var(--color-accent-foreground)] data-hover:[--btn-icon:var(--color-accent-foreground)]',
    ],
    destructive: [
      'text-destructive-foreground [--btn-hover-overlay:var(--color-background)]/10 [--btn-bg:var(--destructive)] [--btn-border:var(--destructive)]/90',
      '[--btn-icon:var(--color-destructive-foreground)]/80 data-active:[--btn-icon:var(--color-destructive-foreground)] data-hover:[--btn-icon:var(--color-destructive-foreground)]',
    ],
  },
}

type ButtonProps = (
  | { color?: keyof typeof styles.colors; outline?: never; plain?: never }
  | { color?: never; outline: true; plain?: never }
  | { color?: never; outline?: never; plain: true }
) & { className?: string; children: React.ReactNode } & (
    | Omit<Headless.ButtonProps, 'as' | 'className'>
    | Omit<React.ComponentPropsWithoutRef<typeof CatalystLink>, 'className'>
  )

export const CatalystButton = forwardRef(function CatalystButton(
  { color, outline, plain, className, children, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLElement>
) {
  let classes = cn(
    styles.base,
    outline
      ? styles.outline
      : plain
        ? styles.plain
        : cn(styles.solid, styles.colors[color ?? 'dark/zinc']),
    className
  )

  return 'href' in props ? (
    <CatalystLink {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <CatalystTouchTarget>{children}</CatalystTouchTarget>
    </CatalystLink>
  ) : (
    <Headless.Button {...props} className={cn(classes, 'cursor-default')} ref={ref}>
      <CatalystTouchTarget>{children}</CatalystTouchTarget>
    </Headless.Button>
  )
})

/**
 * Expand the hit area to at least 44×44px on touch devices
 */
export function CatalystTouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        className={cn(
          'absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 pointer-fine:hidden'
        )}
        aria-hidden="true"
      />
      {children}
    </>
  )
}
