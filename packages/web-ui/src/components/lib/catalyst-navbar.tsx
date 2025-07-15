// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

'use client'
import * as Headless from '@headlessui/react'
import { cn } from '../utils/cn'
import { LayoutGroup, motion } from 'framer-motion'
import React, { forwardRef, useId } from 'react'
import { CatalystTouchTarget } from './catalyst-button'
import { CatalystLink } from './catalyst-link'
export function CatalystNavbar({ className, ...props }: React.ComponentPropsWithoutRef<'nav'>) {
  return <nav {...props} className={cn('flex flex-1 items-center gap-4 py-2.5', className)} />
}
export function CatalystNavbarDivider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={cn('h-6 w-px bg-zinc-950/10 dark:bg-white/10', className)}
    />
  )
}
export function CatalystNavbarSection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  let id = useId()
  return (
    <LayoutGroup id={id}>
      <div {...props} className={cn('flex items-center gap-3', className)} />
    </LayoutGroup>
  )
}
export function CatalystNavbarSpacer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div aria-hidden="true" {...props} className={cn('-ml-4 flex-1', className)} />
}
export const CatalystNavbarItem = forwardRef(function CatalystNavbarItem(
  {
    current,
    className,
    children,
    ...props
  }: {
    current?: boolean
    className?: string
    children: React.ReactNode
  } & (
    | Omit<Headless.ButtonProps, 'as' | 'className'>
    | Omit<React.ComponentPropsWithoutRef<typeof CatalystLink>, 'className'>
  ),
  ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
  let classes = cn(
    // Base
    'relative flex min-w-0 items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-zinc-950 sm:text-sm/5',
    // Leading icon/icon-only
    '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-zinc-500 sm:*:data-[slot=icon]:size-5',
    // Trailing icon (down chevron or similar)
    '*:not-nth-2:last:data-[slot=icon]:ml-auto *:not-nth-2:last:data-[slot=icon]:size-5 sm:*:not-nth-2:last:data-[slot=icon]:size-4',
    // Avatar
    '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 *:data-[slot=avatar]:[--avatar-radius:var(--radius-md)] sm:*:data-[slot=avatar]:size-6',
    // Hover
    'data-hover:bg-zinc-950/5 data-hover:*:data-[slot=icon]:fill-zinc-950',
    // Active
    'data-active:bg-zinc-950/5 data-active:*:data-[slot=icon]:fill-zinc-950',
    // Dark mode
    'dark:text-white dark:*:data-[slot=icon]:fill-zinc-400',
    'dark:data-hover:bg-white/5 dark:data-hover:*:data-[slot=icon]:fill-white',
    'dark:data-active:bg-white/5 dark:data-active:*:data-[slot=icon]:fill-white'
  )
  return (
    <span className={cn('relative', className)}>
      {current && (
        <motion.span
          layoutId="current-indicator"
          className="absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-zinc-950 dark:bg-white"
        />
      )}
      {'href' in props ? (
        <CatalystLink
          {...props}
          className={classes}
          data-current={current ? 'true' : undefined}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        >
          <CatalystTouchTarget>{children}</CatalystTouchTarget>
        </CatalystLink>
      ) : (
        <Headless.Button
          {...props}
          className={cn('cursor-default', classes)}
          data-current={current ? 'true' : undefined}
          ref={ref}
        >
          <CatalystTouchTarget>{children}</CatalystTouchTarget>
        </Headless.Button>
      )}
    </span>
  )
})
export function CatalystNavbarLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={cn('truncate', className)} />
}
