'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { LayoutGroup, motion } from 'framer-motion'
import React, { forwardRef, useId } from 'react'
import { CatalystTouchTarget } from './catalyst-button'
import { CatalystLink } from './catalyst-link'

export function CatalystSidebar({ className, ...props }: React.ComponentPropsWithoutRef<'nav'>) {
  return <nav {...props} className={clsx(className, 'flex h-full min-h-0 flex-col')} />
}

export function CatalystSidebarHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'flex flex-col border-b border-layout-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5'
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
      className={clsx(
        className,
        'flex flex-1 flex-col overflow-y-auto p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8'
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
      className={clsx(
        className,
        'flex flex-col border-t border-layout-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5'
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
      <div {...props} data-slot="section" className={clsx(className, 'flex flex-col gap-0.5')} />
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
      className={clsx(className, 'my-4 border-t border-layout-950/5 lg:-mx-4 dark:border-white/5')}
    />
  )
}

export function CatalystSidebarSpacer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div aria-hidden="true" {...props} className={clsx(className, 'mt-8 flex-1')} />
}

export function CatalystSidebarHeading({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3
      {...props}
      className={clsx(
        className,
        'mb-1 px-2 text-xs/6 font-medium text-layout-500 dark:text-layout-400'
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
  let classes = clsx(
    // Base
    'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-layout-950 sm:py-2 sm:text-sm/5',
    // Leading icon/icon-only
    '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-layout-500 sm:*:data-[slot=icon]:size-5',
    // Trailing icon (down chevron or similar)
    '*:last:data-[slot=icon]:ml-auto *:last:data-[slot=icon]:size-5 sm:*:last:data-[slot=icon]:size-4',
    // Avatar
    '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 sm:*:data-[slot=avatar]:size-6',
    // Hover
    'data-hover:bg-layout-950/5 data-hover:*:data-[slot=icon]:fill-layout-500',
    // Active
    'data-active:bg-layout-950/5 data-active:*:data-[slot=icon]:fill-layout-500',
    // Current
    'data-current:*:data-[slot=icon]:fill-layout-500',
    // Dark mode
    'dark:text-white dark:*:data-[slot=icon]:fill-white',
    'dark:data-hover:bg-white/5 dark:data-hover:*:data-[slot=icon]:fill-layout-500',
    'dark:data-active:bg-white/5 dark:data-active:*:data-[slot=icon]:fill-layout-500',
    'dark:data-current:*:data-[slot=icon]:fill-layout-500'
  )

  return (
    <span className={clsx(className, 'relative')}>
      {current && (
        <motion.span
          layoutId="current-indicator"
          className="absolute inset-y-2 -left-4 w-0.5 rounded-full bg-layout-950 dark:bg-layout-500"
        />
      )}
      {'href' in props ? (
        <Headless.CloseButton
          as={CatalystLink}
          {...(props as any)}
          className={classes}
          data-current={current ? 'true' : undefined}
          ref={ref as any}
        >
          <CatalystTouchTarget>{children}</CatalystTouchTarget>
        </Headless.CloseButton>
      ) : (
        <Headless.Button
          {...(props as any)}
          className={clsx('cursor-default', classes)}
          data-current={current ? 'true' : undefined}
          ref={ref as any}
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
  return <span {...props} className={clsx(className, 'truncate')} />
}
