// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import { CatalystLink } from './catalyst-link'
import { SemanticColorToken, isSemanticToken, createSemanticTextStyles } from '../theme/index'
import { cn } from '../utils/cn'

export function CatalystText({
  className,
  color,
  ...props
}: React.ComponentPropsWithoutRef<'p'> & { color?: SemanticColorToken }) {
  const resolvedStyles = color && isSemanticToken(color) ? createSemanticTextStyles(color) : ''
  return (
    <p
      data-slot="text"
      {...props}
      className={cn(
        'text-base/6 text-muted-foreground sm:text-sm/6 dark:text-muted-foreground',
        resolvedStyles,
        className
      )}
    />
  )
}

export function CatalystTextLink({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CatalystLink>) {
  return (
    <CatalystLink
      {...props}
      className={cn(
        'text-foreground underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-foreground dark:decoration-white/50 dark:data-hover:decoration-white',
        className
      )}
    />
  )
}

export function CatalystStrong({ className, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
  return (
    <strong
      {...props}
      className={cn('font-medium text-foreground dark:text-foreground', className)}
    />
  )
}

export function CatalystCode({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      className={cn(
        'rounded-sm border border-border bg-card/2.5 px-0.5 text-sm font-medium text-foreground sm:text-[0.8125rem] dark:border-border dark:bg-muted/20 dark:text-foreground',
        className
      )}
    />
  )
}
