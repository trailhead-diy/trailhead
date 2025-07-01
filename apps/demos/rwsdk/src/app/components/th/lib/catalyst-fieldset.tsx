// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react';
import type React from 'react';
// Semantic token imports removed - not used in this component
import { cn } from '../utils/cn';

export function CatalystFieldset({
  className,
  ...props
}: { className?: string } & Omit<Headless.FieldsetProps, 'as' | 'className'>) {
  return (
    <Headless.Fieldset
      {...props}
      className={cn(
        '*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6',
        className,
      )}
    />
  );
}

export function CatalystLegend({
  className,
  ...props
}: { className?: string } & Omit<Headless.LegendProps, 'as' | 'className'>) {
  return (
    <Headless.Legend
      data-slot="legend"
      {...props}
      className={cn(
        'text-base/6 font-semibold text-foreground data-disabled:opacity-50 sm:text-sm/6 dark:text-foreground',
        className,
      )}
    />
  );
}

export function CatalystFieldGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="control"
      {...props}
      className={cn('space-y-8', className)}
    />
  );
}

export function CatalystField({
  className,
  ...props
}: { className?: string } & Omit<Headless.FieldProps, 'as' | 'className'>) {
  return (
    <Headless.Field
      {...props}
      className={cn(
        '[&>[data-slot=label]+[data-slot=control]]:mt-3',
        '[&>[data-slot=label]+[data-slot=description]]:mt-1',
        '[&>[data-slot=description]+[data-slot=control]]:mt-3',
        '[&>[data-slot=control]+[data-slot=description]]:mt-3',
        '[&>[data-slot=control]+[data-slot=error]]:mt-3',
        '*:data-[slot=label]:font-medium',
        className,
      )}
    />
  );
}

export function CatalystLabel({
  className,
  ...props
}: { className?: string } & Omit<Headless.LabelProps, 'as' | 'className'>) {
  return (
    <Headless.Label
      data-slot="label"
      {...props}
      className={cn(
        'text-base/6 text-foreground select-none data-disabled:opacity-50 sm:text-sm/6 dark:text-foreground',
        className,
      )}
    />
  );
}

export function CatalystDescription({
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
        'text-base/6 text-muted-foreground data-disabled:opacity-50 sm:text-sm/6 dark:text-muted-foreground',
        className,
      )}
    />
  );
}

export function CatalystErrorMessage({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.DescriptionProps,
  'as' | 'className'
>) {
  return (
    <Headless.Description
      data-slot="error"
      {...props}
      className={cn(
        'text-base/6 text-destructive data-disabled:opacity-50 sm:text-sm/6 dark:text-destructive',
        className,
      )}
    />
  );
}
