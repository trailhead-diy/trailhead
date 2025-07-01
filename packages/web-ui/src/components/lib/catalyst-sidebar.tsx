'use client'
// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.

import * as Headless from '@headlessui/react'
import { LayoutGroup, motion } from 'framer-motion'
import React, { forwardRef, useId } from 'react'
import { CatalystTouchTarget } from './catalyst-button'
import { CatalystLink } from './catalyst-link'
import { cn } from '../utils/cn'

export function CatalystSidebar({ className, ...props }: React.ComponentPropsWithoutRef<'nav'>) {
  return <nav {...props} className={cn('flex h-full min-h-0 flex-col', className)} />
}

export function CatalystSidebarHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-col border-b border-border p-4 dark:border-border [&>[data-slot=section]+[data-slot=section]]:mt-2.5',
        className
      )}
    />
  )
}

export function CatalystSidebarBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-1 flex-col overflow-y-auto p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8',
        className
      )}
    />
  )
}

export function CatalystSidebarFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-col border-t border-border p-4 dark:border-border [&>[data-slot=section]+[data-slot=section]]:mt-2.5',
        className
      )}
    />
  )
}

export function CatalystSidebarSection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  let id = useId()

  return (
    <LayoutGroup id={id}>
      <div {...props} data-slot="section" className={cn('flex flex-col gap-0.5', className)} />
    </LayoutGroup>
  )
}

export function CatalystSidebarDivider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'hr'>) {
  return (
    <hr
      {...props}
      className={cn('my-4 border-t border-border lg:-mx-4 dark:border-border', className)}
    />
  )
}

export function CatalystSidebarSpacer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div aria-hidden="true" {...props} className={cn('mt-8 flex-1', className)} />
}

export function CatalystSidebarHeading({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3
      {...props}
      className={cn(
        'mb-1 px-2 text-xs/6 font-medium text-muted-foreground dark:text-muted-foreground',
        className
      )}
    />
  )
}

export const CatalystSidebarItem = forwardRef(function CatalystSidebarItem(
  {
    current,
    className,
    children,
    ...props
  }: { current?: boolean; className?: string; children: React.ReactNode } & (
    | Omit<Headless.ButtonProps, 'as' | 'className'>
    | Omit<Headless.ButtonProps<typeof CatalystLink>, 'as' | 'className'>
  ),
  ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
  let classes = cn(
    // Base
    'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-foreground sm:py-2 sm:text-sm/5',
    // Leading icon/icon-only
    '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-muted-foreground sm:*:data-[slot=icon]:size-5',
    // Trailing icon (down chevron or similar)
    '*:last:data-[slot=icon]:ml-auto *:last:data-[slot=icon]:size-5 sm:*:last:data-[slot=icon]:size-4',
    // Avatar
    '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 sm:*:data-[slot=avatar]:size-6',
    // Hover
    'data-hover:bg-card/5 data-hover:*:data-[slot=icon]:fill-foreground',
    // Active
    'data-active:bg-card/5 data-active:*:data-[slot=icon]:fill-foreground',
    // Current
    'data-current:*:data-[slot=icon]:fill-foreground',
    // Dark mode
    'dark:text-foreground dark:*:data-[slot=icon]:fill-muted-foreground',
    'dark:data-hover:bg-background/$1 dark:data-hover:*:data-[slot=icon]:fill-foreground',
    'dark:data-active:bg-background/$1 dark:data-active:*:data-[slot=icon]:fill-foreground',
    'dark:data-current:*:data-[slot=icon]:fill-foreground'
  )

  return (
    <span className={cn('relative', className)}>
      {current && (
        <motion.span
          layoutId="current-indicator"
          className={cn('absolute inset-y-2 -left-4 w-0.5 rounded-full bg-zinc-950 dark:bg-white')}
        />
      )}
      {'href' in props ? (
        <Headless.CloseButton
          as={CatalystLink}
          {...props}
          className={classes}
          data-current={current ? 'true' : undefined}
          ref={ref}
        >
          <CatalystTouchTarget>{children}</CatalystTouchTarget>
        </Headless.CloseButton>
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

export function CatalystSidebarLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={cn('truncate', className)} />
}
