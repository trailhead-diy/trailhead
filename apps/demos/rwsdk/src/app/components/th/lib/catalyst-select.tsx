// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react';
import React, { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const CatalystSelect = forwardRef(function CatalystSelect(
  {
    className,
    multiple,
    ...props
  }: { className?: string } & Omit<Headless.SelectProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  return (
    <span
      data-slot="control"
      className={cn([
        className,
        // Basic layout
        'group relative block w-full',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset has-data-focus:after:ring-2 has-data-focus:after:ring-primary',
        // Disabled state
        'has-data-disabled:opacity-50 has-data-disabled:before:bg-muted has-data-disabled:before:shadow-none',
      ])}
    >
      <Headless.Select
        ref={ref}
        multiple={multiple}
        {...props}
        className={cn([
          // Basic layout
          'relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          // Horizontal padding
          multiple
            ? 'px-[calc(--spacing(3.5)-1px)] sm:px-[calc(--spacing(3)-1px)]'
            : 'pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pr-[calc(--spacing(9)-1px)] sm:pl-[calc(--spacing(3)-1px)]',
          // Options (multi-select)
          '[&_optgroup]:font-semibold',
          // Typography
          'text-base/6 text-foreground placeholder:text-muted-foreground sm:text-sm/6 dark:text-foreground dark:*:text-white',
          // Border
          'border border-input data-hover:border-primary/50 dark:border-input dark:data-hover:border-primary/50',
          // Background color
          'bg-transparent dark:bg-muted dark:*:bg-muted',
          // Hide default focus styles
          'focus:outline-hidden',
          // Invalid state
          'data-invalid:border-destructive data-invalid:data-hover:border-destructive dark:data-invalid:border-destructive dark:data-invalid:data-hover:border-destructive',
          // Disabled state
          'data-disabled:border-muted-foreground/20 data-disabled:opacity-100 dark:data-disabled:border-muted-foreground/20 dark:data-disabled:bg-muted dark:data-hover:data-disabled:border-muted-foreground/20',
        ])}
      />
      {!multiple && (
        <span
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2',
          )}
        >
          <svg
            className={cn(
              'size-5 stroke-muted-foreground group-has-data-disabled:stroke-muted-foreground sm:size-4 dark:stroke-muted-foreground forced-colors:stroke-[CanvasText]',
            )}
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M5.75 10.75L8 13L10.25 10.75"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.25 5.25L8 3L5.75 5.25"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </span>
  );
});
