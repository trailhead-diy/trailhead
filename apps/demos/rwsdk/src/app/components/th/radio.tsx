import { type ComponentProps } from 'react'
import { cn } from './utils/cn'
import { CatalystRadio, CatalystRadioField, CatalystRadioGroup } from './lib/catalyst-radio'

export type RadioProps = ComponentProps<typeof CatalystRadio>
export type RadioGroupProps = ComponentProps<typeof CatalystRadioGroup>
export type RadioFieldProps = ComponentProps<typeof CatalystRadioField>

export const Radio = ({ className, ...props }: RadioProps) => (
  <CatalystRadio {...(className && { className: cn(className) })} {...props} />
)

export const RadioField = CatalystRadioField

export const RadioGroup = ({ className, children, ...props }: RadioGroupProps) => (
  <CatalystRadioGroup {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystRadioGroup>
)
