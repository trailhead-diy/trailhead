import { type ComponentProps } from 'react'
import { cn } from './utils/cn'
import { CatalystInput, CatalystInputGroup } from './lib/catalyst-input'

export type InputProps = ComponentProps<typeof CatalystInput>
export type InputGroupProps = ComponentProps<typeof CatalystInputGroup>

export const Input = ({ className, children, ...props }: InputProps) => (
  <CatalystInput {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystInput>
)

export const InputGroup = ({ className, children, ...props }: InputGroupProps) => (
  <CatalystInputGroup {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystInputGroup>
)
