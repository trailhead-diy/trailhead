// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react';
import React, { forwardRef } from 'react';
// Semantic token imports removed - not used in this component
import { cn } from '../utils/cn';

export const CatalystTextarea = forwardRef(function CatalystTextarea(
  {
    className,
    resizable = true,
    ...props
  }: { className?: string; resizable?: boolean } & Omit<Headless.TextareaProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLTextAreaElement>
) {
  return (
    <span
      data-slot="control"
      className={cn([
        className,
        // Basic layout
        'relative block w-full',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-primary',
        // Disabled state
        'has-data-disabled:opacity-50 has-data-disabled:before:bg-muted has-data-disabled:before:shadow-none',
      ])}
    >
      <Headless.Textarea
        ref={ref}
        {...props}
        className={cn([
          // Basic layout
          'relative block h-full w-full appearance-none rounded-lg px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          // Typography
          'text-base/6 text-foreground placeholder:text-muted-foreground sm:text-sm/6 dark:text-foreground',
          // Border
          'border border-input data-hover:border-primary/50 dark:border-input dark:data-hover:border-primary/50',
          // Background color
          'bg-transparent dark:bg-muted',
          // Hide default focus styles
          'focus:outline-hidden',
          // Invalid state
          'data-invalid:border-destructive data-invalid:data-hover:border-destructive dark:data-invalid:border-destructive dark:data-invalid:data-hover:border-destructive',
          // Disabled state
          'disabled:border-muted-foreground/20 dark:disabled:border-muted-foreground/20 dark:disabled:bg-muted dark:data-hover:disabled:border-muted-foreground/20',
          // Resizable
          resizable ? 'resize-y' : 'resize-none',
        ])}
      />
    </span>
  );
});
