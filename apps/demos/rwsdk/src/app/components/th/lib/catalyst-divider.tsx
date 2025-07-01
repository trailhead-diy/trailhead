// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import { cn } from '../utils/cn';

export function CatalystDivider({
  soft = false,
  className,
  ...props
}: { soft?: boolean } & React.ComponentPropsWithoutRef<'hr'>) {
  return (
    <hr
      role="presentation"
      {...props}
      className={cn(
        'w-full border-t',
        soft && 'border-zinc-950/5 dark:border-border',
        !soft && 'border-zinc-950/10 dark:border-border',
        className,
      )}
    />
  );
}
