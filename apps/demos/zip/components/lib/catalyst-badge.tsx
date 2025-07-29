import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { CatalystTouchTarget } from './catalyst-button'
import { CatalystLink } from './catalyst-link'

const colors = {
  // Semantic color variants using CSS variables (consistent with Button API)
  primary:
    'bg-[var(--color-primary)]/15 text-primary-foreground group-data-hover:bg-[var(--color-primary)]/25 dark:bg-[var(--color-primary)]/10 dark:text-primary-foreground dark:group-data-hover:bg-[var(--color-primary)]/20',
  secondary:
    'bg-[var(--color-secondary)]/15 text-secondary-foreground group-data-hover:bg-[var(--color-secondary)]/25 dark:bg-[var(--color-secondary)]/10 dark:text-secondary-foreground dark:group-data-hover:bg-[var(--color-secondary)]/20',
  destructive:
    'bg-[var(--color-destructive)]/15 text-destructive-foreground group-data-hover:bg-[var(--color-destructive)]/25 dark:bg-[var(--color-destructive)]/10 dark:text-destructive-foreground dark:group-data-hover:bg-[var(--color-destructive)]/20',
  success:
    'bg-[var(--color-success)]/15 text-success-foreground group-data-hover:bg-[var(--color-success)]/25 dark:bg-[var(--color-success)]/10 dark:text-success-foreground dark:group-data-hover:bg-[var(--color-success)]/20',
  warning:
    'bg-[var(--color-warning)]/15 text-warning-foreground group-data-hover:bg-[var(--color-warning)]/25 dark:bg-[var(--color-warning)]/10 dark:text-warning-foreground dark:group-data-hover:bg-[var(--color-warning)]/20',
  info: 'bg-[var(--color-info)]/15 text-info-foreground group-data-hover:bg-[var(--color-info)]/25 dark:bg-[var(--color-info)]/10 dark:text-info-foreground dark:group-data-hover:bg-[var(--color-info)]/20',
  // Specific color variants
  red: 'bg-red-500/15 text-red-700 group-data-hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:group-data-hover:bg-red-500/20',
  orange:
    'bg-orange-500/15 text-orange-700 group-data-hover:bg-orange-500/25 dark:bg-orange-500/10 dark:text-orange-400 dark:group-data-hover:bg-orange-500/20',
  amber:
    'bg-amber-400/20 text-amber-700 group-data-hover:bg-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400 dark:group-data-hover:bg-amber-400/15',
  yellow:
    'bg-yellow-400/20 text-yellow-700 group-data-hover:bg-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-300 dark:group-data-hover:bg-yellow-400/15',
  lime: 'bg-lime-400/20 text-lime-700 group-data-hover:bg-lime-400/30 dark:bg-lime-400/10 dark:text-lime-300 dark:group-data-hover:bg-lime-400/15',
  green:
    'bg-green-500/15 text-green-700 group-data-hover:bg-green-500/25 dark:bg-green-500/10 dark:text-green-400 dark:group-data-hover:bg-green-500/20',
  emerald:
    'bg-emerald-500/15 text-emerald-700 group-data-hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-data-hover:bg-emerald-500/20',
  teal: 'bg-teal-500/15 text-teal-700 group-data-hover:bg-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300 dark:group-data-hover:bg-teal-500/20',
  cyan: 'bg-cyan-400/20 text-cyan-700 group-data-hover:bg-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300 dark:group-data-hover:bg-cyan-400/15',
  sky: 'bg-sky-500/15 text-sky-700 group-data-hover:bg-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:group-data-hover:bg-sky-500/20',
  blue: 'bg-blue-500/15 text-blue-700 group-data-hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:group-data-hover:bg-blue-500/20',
  indigo:
    'bg-indigo-500/15 text-indigo-700 group-data-hover:bg-indigo-500/25 dark:text-indigo-400 dark:group-data-hover:bg-indigo-500/20',
  violet:
    'bg-violet-500/15 text-violet-700 group-data-hover:bg-violet-500/25 dark:text-violet-400 dark:group-data-hover:bg-violet-500/20',
  purple:
    'bg-purple-500/15 text-purple-700 group-data-hover:bg-purple-500/25 dark:text-purple-400 dark:group-data-hover:bg-purple-500/20',
  fuchsia:
    'bg-fuchsia-400/15 text-fuchsia-700 group-data-hover:bg-fuchsia-400/25 dark:bg-fuchsia-400/10 dark:text-fuchsia-400 dark:group-data-hover:bg-fuchsia-400/20',
  pink: 'bg-pink-400/15 text-pink-700 group-data-hover:bg-pink-400/25 dark:bg-pink-400/10 dark:text-pink-400 dark:group-data-hover:bg-pink-400/20',
  rose: 'bg-rose-400/15 text-rose-700 group-data-hover:bg-rose-400/25 dark:bg-rose-400/10 dark:text-rose-400 dark:group-data-hover:bg-rose-400/20',
  base: 'bg-base-600/10 text-base-700 group-data-hover:bg-base-600/20 dark:bg-white/5 dark:text-base-400 dark:group-data-hover:bg-white/10',
}

type BadgeProps = { color?: keyof typeof colors }

export function CatalystBadge({
  color = 'base',
  className,
  ...props
}: BadgeProps & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        'group inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5 forced-colors:outline',
        colors[color]
      )}
    />
  )
}

export const CatalystBadgeButton = forwardRef(function BadgeButton(
  {
    color = 'base',
    className,
    children,
    ...props
  }: BadgeProps & { className?: string; children: React.ReactNode } & (
      | Omit<Headless.ButtonProps, 'as' | 'className'>
      | Omit<React.ComponentPropsWithoutRef<typeof CatalystLink>, 'className'>
    ),
  ref: React.ForwardedRef<HTMLElement>
) {
  let classes = clsx(
    className,
    'group relative inline-flex rounded-md focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-[var(--color-primary)]'
  )

  return 'href' in props ? (
    <CatalystLink {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <CatalystTouchTarget>
        <CatalystBadge color={color}>{children}</CatalystBadge>
      </CatalystTouchTarget>
    </CatalystLink>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref}>
      <CatalystTouchTarget>
        <CatalystBadge color={color}>{children}</CatalystBadge>
      </CatalystTouchTarget>
    </Headless.Button>
  )
})
