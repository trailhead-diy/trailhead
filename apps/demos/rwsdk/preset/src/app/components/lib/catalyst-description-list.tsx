import clsx from 'clsx'

export function CatalystDescriptionList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dl'>) {
  return (
    <dl
      {...props}
      className={clsx(
        className,
        'grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,--spacing(80))_auto] sm:text-sm/6'
      )}
    />
  )
}

export function CatalystDescriptionTerm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <dt
      {...props}
      className={clsx(
        className,
        'col-start-1 border-t border-base-950/5 pt-3 text-base-500 first:border-none sm:border-t sm:border-base-950/5 sm:py-3 dark:border-white/5 dark:text-base-400 sm:dark:border-white/5'
      )}
    />
  )
}

export function CatalystDescriptionDetails({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd
      {...props}
      className={clsx(
        className,
        'pt-1 pb-3 text-base-950 sm:border-t sm:border-base-950/5 sm:py-3 sm:nth-2:border-none dark:text-white dark:sm:border-white/5'
      )}
    />
  )
}
