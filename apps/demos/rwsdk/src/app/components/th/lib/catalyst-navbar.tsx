'use client';
// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react';
import { LayoutGroup, motion } from 'framer-motion';
import React, { forwardRef, useId } from 'react';
import { CatalystTouchTarget } from './catalyst-button';
import { CatalystLink } from './catalyst-link';
import { SemanticColorToken, isSemanticToken, createSemanticStyles } from '../theme/index';
import { cn } from '../utils/cn';

export function CatalystNavbar({
  className,
  color,
  ...props
}: React.ComponentPropsWithoutRef<'nav'> & { color?: SemanticColorToken }) {
  const resolvedColorClasses = color && isSemanticToken(color) ? createSemanticStyles(color) : '';
  return (
    <nav
      {...props}
      className={cn('flex flex-1 items-center gap-4 py-2.5', className, resolvedColorClasses)}
    />
  );
}

export function CatalystNavbarDivider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={cn('h-6 w-px bg-card/10 dark:bg-muted/20', className)}
    />
  );
}

export function CatalystNavbarSection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  let id = useId();

  return (
    <LayoutGroup id={id}>
      <div {...props} className={cn('flex items-center gap-3', className)} />
    </LayoutGroup>
  );
}

export function CatalystNavbarSpacer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div aria-hidden="true" {...props} className={cn('-ml-4 flex-1', className)} />;
}

export const CatalystNavbarItem = forwardRef(function CatalystNavbarItem(
  {
    current,
    className,
    children,
    ...props
  }: { current?: boolean; className?: string; children: React.ReactNode } & (
    | Omit<Headless.ButtonProps, 'as' | 'className'>
    | Omit<React.ComponentPropsWithoutRef<typeof CatalystLink>, 'className'>
  ),
  ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
  let classes = cn(
    // Base
    'relative flex min-w-0 items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-foreground sm:text-sm/5',
    // Leading icon/icon-only
    '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-muted-foreground sm:*:data-[slot=icon]:size-5',
    // Trailing icon (down chevron or similar)
    '*:not-nth-2:last:data-[slot=icon]:ml-auto *:not-nth-2:last:data-[slot=icon]:size-5 sm:*:not-nth-2:last:data-[slot=icon]:size-4',
    // Avatar
    '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 *:data-[slot=avatar]:[--avatar-radius:var(--radius-md)] sm:*:data-[slot=avatar]:size-6',
    // Hover
    'data-hover:bg-card/5 data-hover:*:data-[slot=icon]:fill-foreground',
    // Active
    'data-active:bg-card/5 data-active:*:data-[slot=icon]:fill-foreground',
    // Dark mode
    'dark:text-foreground dark:*:data-[slot=icon]:fill-muted-foreground',
    'dark:data-hover:bg-accent dark:data-hover:*:data-[slot=icon]:fill-foreground',
    'dark:data-active:bg-accent dark:data-active:*:data-[slot=icon]:fill-foreground'
  );

  return (
    <span className={cn('relative', className)}>
      {current && (
        <motion.span
          layoutId="current-indicator"
          className={cn('absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-primary')}
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
  );
});

export function CatalystNavbarLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={cn('truncate', className)} />;
}
