// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import { cn } from '../utils/cn';
import type React from 'react';
import { CatalystButton } from './catalyst-button';
export function CatalystPagination({
  'aria-label': ariaLabel = 'Page navigation',
  className,
  ...props
}: React.ComponentPropsWithoutRef<'nav'>) {
  return <nav aria-label={ariaLabel} {...props} className={cn('flex gap-x-2', className)} />;
}
export function CatalystPaginationPrevious({
  href = null,
  className,
  children = 'Previous',
}: React.PropsWithChildren<{
  href?: string | null;
  className?: string;
}>) {
  return (
    <span className={cn('grow basis-0', className)}>
      <CatalystButton
        {...(href === null ? { disabled: true } : { href })}
        plain
        aria-label="Previous page"
      >
        <svg
          className="stroke-current"
          data-slot="icon"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.75 8H13.25M2.75 8L5.25 5.5M2.75 8L5.25 10.5"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {children}
      </CatalystButton>
    </span>
  );
}
export function CatalystPaginationNext({
  href = null,
  className,
  children = 'Next',
}: React.PropsWithChildren<{
  href?: string | null;
  className?: string;
}>) {
  return (
    <span className={cn('flex grow basis-0 justify-end', className)}>
      <CatalystButton
        {...(href === null ? { disabled: true } : { href })}
        plain
        aria-label="Next page"
      >
        {children}
        <svg
          className="stroke-current"
          data-slot="icon"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M13.25 8L2.75 8M13.25 8L10.75 10.5M13.25 8L10.75 5.5"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CatalystButton>
    </span>
  );
}
export function CatalystPaginationList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={cn('hidden items-baseline gap-x-2 sm:flex', className)} />;
}
export function CatalystPaginationPage({
  href,
  className,
  current = false,
  children,
}: React.PropsWithChildren<{
  href: string;
  className?: string;
  current?: boolean;
}>) {
  return (
    <CatalystButton
      href={href}
      plain
      aria-label={`Page ${children}`}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'min-w-9 before:absolute before:-inset-px before:rounded-lg',
        current && 'before:bg-zinc-950/5 dark:before:bg-white/10',
        className
      )}
    >
      <span className="-mx-0.5">{children}</span>
    </CatalystButton>
  );
}
export function CatalystPaginationGap({
  className,
  children = <>&hellip;</>,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      aria-hidden="true"
      {...props}
      className={cn(
        'w-9 text-center text-sm/6 font-semibold text-zinc-950 select-none dark:text-white',
        className
      )}
    >
      {children}
    </span>
  );
}
