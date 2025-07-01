// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import { cn } from '../utils/cn';

export function CatalystDescriptionList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dl'>) {
  return (
    <dl
      {...props}
      className={cn(
        'grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,--spacing(80))_auto] sm:text-sm/6',
        className,
      )}
    />
  );
}

export function CatalystDescriptionTerm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <dt
      {...props}
      className={cn(
        'col-start-1 border-t border-border pt-3 text-muted-foreground first:border-none sm:border-t sm:border-border sm:py-3 dark:border-border dark:text-muted-foreground sm:dark:border-border',
        className,
      )}
    />
  );
}

export function CatalystDescriptionDetails({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd
      {...props}
      className={cn(
        'pt-1 pb-3 text-foreground sm:border-t sm:border-border sm:py-3 sm:nth-2:border-none dark:text-foreground dark:sm:border-border',
        className,
      )}
    />
  );
}
