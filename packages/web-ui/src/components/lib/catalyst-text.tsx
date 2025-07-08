// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import { CatalystLink } from './catalyst-link';
import { cn } from '../utils/cn';

export function CatalystText({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      data-slot="text"
      {...props}
      className={cn('text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400', className)}
    />
  );
}

export function CatalystTextLink({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CatalystLink>) {
  return (
    <CatalystLink
      {...props}
      className={cn(
        'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white',
        className
      )}
    />
  );
}

export function CatalystStrong({ className, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
  return (
    <strong {...props} className={cn('font-medium text-zinc-950 dark:text-white', className)} />
  );
}

export function CatalystCode({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      className={cn(
        'rounded-sm border border-zinc-950/10 bg-zinc-950/2.5 px-0.5 text-sm font-medium text-zinc-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white',
        className
      )}
    />
  );
}
