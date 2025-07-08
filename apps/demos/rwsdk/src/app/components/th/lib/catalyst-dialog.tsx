// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import * as Headless from '@headlessui/react';
import type React from 'react';
import { CatalystText } from './catalyst-text';
import { SemanticColorToken, isSemanticToken, createSemanticStyles } from '../theme/index';
import { cn } from '../utils/cn';

const sizes = {
  xs: 'sm:max-w-xs',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
};

export function CatalystDialog({
  size = 'lg',
  className,
  children,
  color,
  ...props
}: {
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
  color?: SemanticColorToken;
} & Omit<Headless.DialogProps, 'as' | 'className'>) {
  const resolvedColorClasses = color && isSemanticToken(color) ? createSemanticStyles(color) : '';
  return (
    <Headless.Dialog {...props}>
      <Headless.DialogBackdrop
        transition
        className={cn(
          'fixed inset-0 flex w-screen justify-center overflow-y-auto bg-card/25 px-2 py-2 transition duration-100 focus:outline-0 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:px-6 sm:py-8 lg:px-8 lg:py-16 dark:bg-background/50',
          resolvedColorClasses
        )}
      />
      <div
        className={cn('fixed inset-0 w-screen overflow-y-auto pt-6 sm:pt-0', resolvedColorClasses)}
      >
        <div
          className={cn(
            'grid min-h-full grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr] sm:p-4',
            resolvedColorClasses
          )}
        >
          <Headless.DialogPanel
            transition
            className={cn(
              sizes[size],
              'row-start-2 w-full min-w-0 rounded-t-3xl bg-white p-(--gutter) shadow-lg ring-1 ring-zinc-950/10 [--gutter:--spacing(8)] sm:mb-auto sm:rounded-2xl dark:bg-card dark:ring-ring forced-colors:outline',
              'transition duration-100 will-change-transform data-closed:translate-y-12 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:data-closed:translate-y-0 sm:data-closed:data-enter:scale-95',
              className,
              resolvedColorClasses
            )}
          >
            {children}
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  );
}

export function CatalystDialogTitle({
  className,
  ...props
}: { className?: string } & Omit<Headless.DialogTitleProps, 'as' | 'className'>) {
  return (
    <Headless.DialogTitle
      {...props}
      className={cn(
        'text-lg/6 font-semibold text-balance text-foreground sm:text-base/6 dark:text-foreground',
        className
      )}
    />
  );
}

export function CatalystDialogDescription({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.DescriptionProps<typeof CatalystText>,
  'as' | 'className'
>) {
  return (
    <Headless.Description
      as={CatalystText}
      {...props}
      className={cn('mt-2 text-pretty', className)}
    />
  );
}

export function CatalystDialogBody({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cn('mt-6', className)} />;
}

export function CatalystDialogActions({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'mt-8 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:flex-row sm:*:w-auto',
        className
      )}
    />
  );
}
