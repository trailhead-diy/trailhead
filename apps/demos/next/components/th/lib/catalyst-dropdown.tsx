'use client';
// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.

import * as Headless from '@headlessui/react';
import type React from 'react';
import { CatalystButton } from './catalyst-button';
import { CatalystLink } from './catalyst-link';
import { cn } from '../utils/cn';

export function CatalystDropdown(props: Headless.MenuProps) {
  return <Headless.Menu {...props} />;
}

export function CatalystDropdownButton<
  T extends React.ElementType = typeof CatalystButton,
>({
  as = CatalystButton,
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuButtonProps<T>, 'className'>) {
  return <Headless.MenuButton as={as} className={className} {...props} />;
}

export function CatalystDropdownMenu({
  anchor = 'bottom',
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuItemsProps, 'as' | 'className'>) {
  return (
    <Headless.MenuItems
      {...props}
      transition
      anchor={anchor}
      className={cn(
        // Anchor positioning
        '[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)] data-[anchor~=end]:[--anchor-offset:6px] data-[anchor~=start]:[--anchor-offset:-6px] sm:data-[anchor~=end]:[--anchor-offset:4px] sm:data-[anchor~=start]:[--anchor-offset:-4px]',
        // Base styles
        'isolate w-max rounded-xl p-1',
        // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
        'outline outline-transparent focus:outline-hidden',
        // Handle scrolling when menu won't fit in viewport
        'overflow-y-auto',
        // Popover background
        'bg-white/75 backdrop-blur-xl dark:bg-muted/75',
        // Shadows
        'shadow-lg ring-1 ring-zinc-950/10 dark:ring-ring dark:ring-inset',
        // Define grid at the menu level if subgrid is supported
        'supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
        // Transitions
        'transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0',
        className,
      )}
    />
  );
}

export function CatalystDropdownItem({
  className,
  ...props
}: { className?: string } & (
  | Omit<Headless.MenuItemProps<'button'>, 'as' | 'className'>
  | Omit<Headless.MenuItemProps<typeof CatalystLink>, 'as' | 'className'>
)) {
  let classes = cn(
    // Base styles
    'group cursor-default rounded-lg px-3.5 py-2.5 focus:outline-hidden sm:px-3 sm:py-1.5',
    // Text styles
    'text-left text-base/6 text-foreground sm:text-sm/6 dark:text-foreground forced-colors:text-[CanvasText]',
    // Focus
    'data-focus:bg-primary data-focus:text-foreground',
    // Disabled state
    'data-disabled:opacity-50',
    // Forced colors mode
    'forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText] forced-colors:data-focus:*:data-[slot=icon]:text-[HighlightText]',
    // Use subgrid when available but fallback to an explicit grid layout if not
    'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
    // Icons
    '*:data-[slot=icon]:col-start-1 *:data-[slot=icon]:row-start-1 *:data-[slot=icon]:mr-2.5 *:data-[slot=icon]:-ml-0.5 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:mr-2 sm:*:data-[slot=icon]:size-4',
    '*:data-[slot=icon]:text-muted-foreground data-focus:*:data-[slot=icon]:text-foreground dark:*:data-[slot=icon]:text-muted-foreground dark:data-focus:*:data-[slot=icon]:text-foreground',
    // Avatar
    '*:data-[slot=avatar]:mr-2.5 *:data-[slot=avatar]:-ml-1 *:data-[slot=avatar]:size-6 sm:*:data-[slot=avatar]:mr-2 sm:*:data-[slot=avatar]:size-5',
    className,
  );

  return 'href' in props ? (
    <Headless.MenuItem as={CatalystLink} {...props} className={classes} />
  ) : (
    <Headless.MenuItem
      as="button"
      type="button"
      {...props}
      className={classes}
    />
  );
}

export function CatalystDropdownHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn('col-span-5 px-3.5 pt-2.5 pb-1 sm:px-3', className)}
    />
  );
}

export function CatalystDropdownSection({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuSectionProps,
  'as' | 'className'
>) {
  return (
    <Headless.MenuSection
      {...props}
      className={cn(
        // Define grid at the section level instead of the item level if subgrid is supported
        'col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
        className,
      )}
    />
  );
}

export function CatalystDropdownHeading({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuHeadingProps,
  'as' | 'className'
>) {
  return (
    <Headless.MenuHeading
      {...props}
      className={cn(
        'col-span-full grid grid-cols-[1fr_auto] gap-x-12 px-3.5 pt-2 pb-1 text-sm/5 font-medium text-muted-foreground sm:px-3 sm:text-xs/5 dark:text-muted-foreground',
        className,
      )}
    />
  );
}

export function CatalystDropdownDivider({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuSeparatorProps,
  'as' | 'className'
>) {
  return (
    <Headless.MenuSeparator
      {...props}
      className={cn(
        'col-span-full mx-3.5 my-1 h-px border-0 bg-card/5 sm:mx-3 dark:bg-card/5 forced-colors:bg-[CanvasText]',
        className,
      )}
    />
  );
}

export function CatalystDropdownLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="label"
      {...props}
      className={cn('col-start-2 row-start-1', className)}
    />
  );
}

export function CatalystDropdownDescription({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.DescriptionProps,
  'as' | 'className'
>) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={cn(
        'col-span-2 col-start-2 row-start-2 text-sm/5 text-muted-foreground group-data-focus:text-foreground sm:text-xs/5 dark:text-muted-foreground forced-colors:group-data-focus:text-[HighlightText]',
        className,
      )}
    />
  );
}

export function CatalystDropdownShortcut({
  keys,
  className,
  ...props
}: { keys: string | string[]; className?: string } & Omit<
  Headless.DescriptionProps<'kbd'>,
  'as' | 'className'
>) {
  return (
    <Headless.Description
      as="kbd"
      {...props}
      className={cn('col-start-5 row-start-1 flex justify-self-end', className)}
    >
      {(Array.isArray(keys) ? keys : keys.split('')).map((char, index) => (
        <kbd
          key={index}
          className={cn([
            'min-w-[2ch] text-center font-sans text-muted-foreground capitalize group-data-focus:text-foreground forced-colors:group-data-focus:text-[HighlightText]',
            // Make sure key names that are longer than one character (like "Tab") have extra space
            index > 0 && char.length > 1 && 'pl-1',
          ])}
        >
          {char}
        </kbd>
      ))}
    </Headless.Description>
  );
}
