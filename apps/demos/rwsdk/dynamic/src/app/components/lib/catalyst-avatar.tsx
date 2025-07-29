import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { CatalystTouchTarget } from './catalyst-button'
import { CatalystLink } from './catalyst-link'

type AvatarProps = {
  src?: string | null
  square?: boolean
  initials?: string
  alt?: string
  className?: string
}

export function CatalystAvatar({
  src = null,
  square = false,
  initials,
  alt = '',
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="avatar"
      {...props}
      className={clsx(
        className,
        // Basic layout
        'inline-grid shrink-0 align-middle [--avatar-radius:20%] *:col-start-1 *:row-start-1',
        'outline -outline-offset-1 outline-black/10 dark:outline-white/10',
        // Border radius
        square
          ? 'rounded-(--avatar-radius) *:rounded-(--avatar-radius)'
          : 'rounded-full *:rounded-full'
      )}
    >
      {initials && (
        <svg
          className="size-full fill-current p-[5%] text-[48px] font-medium uppercase select-none"
          viewBox="0 0 100 100"
          aria-hidden={alt ? undefined : 'true'}
        >
          {alt && <title>{alt}</title>}
          <text
            x="50%"
            y="50%"
            alignmentBaseline="middle"
            dominantBaseline="middle"
            textAnchor="middle"
            dy=".125em"
          >
            {initials}
          </text>
        </svg>
      )}
      {src && <img className="size-full" src={src} alt={alt} />}
    </span>
  )
}

export const CatalystAvatarButton = forwardRef(function AvatarButton(
  {
    src,
    square = false,
    initials,
    alt,
    className,
    ...props
  }: AvatarProps &
    (
      | Omit<Headless.ButtonProps, 'as' | 'className'>
      | Omit<React.ComponentPropsWithoutRef<typeof CatalystLink>, 'className'>
    ),
  ref: React.ForwardedRef<HTMLElement>
) {
  let classes = clsx(
    className,
    square ? 'rounded-[20%]' : 'rounded-full',
    'relative inline-grid focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-[var(--color-primary)]'
  )

  return 'href' in props ? (
    <CatalystLink {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <CatalystTouchTarget>
        <CatalystAvatar src={src} square={square} initials={initials} alt={alt} />
      </CatalystTouchTarget>
    </CatalystLink>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref}>
      <CatalystTouchTarget>
        <CatalystAvatar src={src} square={square} initials={initials} alt={alt} />
      </CatalystTouchTarget>
    </Headless.Button>
  )
})
