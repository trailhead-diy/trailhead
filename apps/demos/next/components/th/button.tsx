import { forwardRef, type ComponentProps } from 'react'
import { cn } from './utils/cn'
import { CatalystButton } from './lib/catalyst-button'

export type ButtonProps = ComponentProps<typeof CatalystButton>

export const Button = forwardRef<HTMLElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystButton ref={ref} {...(className && { className: cn(className) })} {...props}>
      {children}
    </CatalystButton>
  )
)

Button.displayName = 'Button'
