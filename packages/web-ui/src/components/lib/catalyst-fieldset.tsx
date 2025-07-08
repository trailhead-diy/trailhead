// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react'
import type React from 'react'
import { cn } from '../utils/cn';

export function CatalystFieldset({
  className,
  ...props
}: { className?: string } & Omit<Headless.CatalystFieldsetProps, 'as' | 'className'>) {
  return (
    <Headless.Fieldset
      {...props}
      className={cn('*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6', className)}
    />
  );
}

export function CatalystLegend({
  className,
  ...props
}: { className?: string } & Omit<Headless.CatalystLegendProps, 'as' | 'className'>) {
  return (
    <Headless.Legend
      data-slot="legend"
      {...props}
      className={cn(
        'text-base/6 font-semibold text-zinc-950 data-disabled:opacity-50 sm:text-sm/6 dark:text-white',
        className
      )}
    />
  );
}

export function CatalystFieldGroup({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div data-slot="control" {...props} className={cn('space-y-8', className)} />;
}

export function CatalystField({ className, ...props }: { className?: string } & Omit<Headless.CatalystFieldProps, 'as' | 'className'>) {
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
        className
      )}
    />
  );
}

export function CatalystLabel({ className, ...props }: { className?: string } & Omit<Headless.CatalystLabelProps, 'as' | 'className'>) {
  return (
    <Headless.Label
      data-slot="label"
      {...props}
      className={cn(
        'text-base/6 text-zinc-950 select-none data-disabled:opacity-50 sm:text-sm/6 dark:text-white',
        className
      )}
    />
  );
}

export function CatalystDescription({
  className,
  ...props
}: { className?: string } & Omit<Headless.CatalystDescriptionProps, 'as' | 'className'>) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={cn('text-base/6 text-zinc-500 data-disabled:opacity-50 sm:text-sm/6 dark:text-zinc-400', className)}
    />
  );
}

export function CatalystErrorMessage({
  className,
  ...props
}: { className?: string } & Omit<Headless.CatalystDescriptionProps, 'as' | 'className'>) {
  return (
    <Headless.Description
      data-slot="error"
      {...props}
      className={cn('text-base/6 text-red-600 data-disabled:opacity-50 sm:text-sm/6 dark:text-red-500', className)}
    />
  );
}
