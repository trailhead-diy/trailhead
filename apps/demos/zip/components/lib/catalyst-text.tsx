import clsx from 'clsx'
import { CatalystLink } from './catalyst-link'

export function CatalystText({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      data-slot="text"
      {...props}
      className={clsx(className, 'text-base/6 text-base-500 sm:text-sm/6 dark:text-base-400')}
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
      className={clsx(
        className,
        'text-base-950 underline decoration-base-950/50 data-hover:decoration-base-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white'
      )}
    />
  )
}

export function CatalystStrong({ className, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
  return (
    <strong {...props} className={clsx(className, 'font-medium text-base-950 dark:text-white')} />
  )
}

export function CatalystCode({ className, ...props }: React.ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      {...props}
      className={clsx(
        className,
        'rounded-sm border border-base-950/10 bg-base-950/2.5 px-0.5 text-sm font-medium text-base-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white'
      )}
    />
  )
}
