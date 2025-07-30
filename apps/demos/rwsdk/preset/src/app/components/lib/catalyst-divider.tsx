import clsx from 'clsx'

export function CatalystDivider({
  soft = false,
  className,
  ...props
}: { soft?: boolean } & React.ComponentPropsWithoutRef<'hr'>) {
  return (
    <hr
      role="presentation"
      {...props}
      className={clsx(
        className,
        'w-full border-t',
        soft && 'border-base-950/5 dark:border-white/5',
        !soft && 'border-base-950/10 dark:border-white/10'
      )}
    />
  )
}
