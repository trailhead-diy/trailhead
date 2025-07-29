'use client'

import { type ComponentProps } from 'react'
import { cn } from './utils/cn'
import {
  CatalystCombobox,
  CatalystComboboxOption,
  CatalystComboboxLabel,
  CatalystComboboxDescription,
} from './lib/catalyst-combobox'

type ComboboxProps = ComponentProps<typeof CatalystCombobox>
type ComboboxOptionProps = ComponentProps<typeof CatalystComboboxOption>
type ComboboxLabelProps = ComponentProps<typeof CatalystComboboxLabel>
type ComboboxDescriptionProps = ComponentProps<typeof CatalystComboboxDescription>

export const Combobox = ({ className, children, ...props }: ComboboxProps) => (
  <CatalystCombobox className={cn(className)} {...props}>
    {children}
  </CatalystCombobox>
)

export const ComboboxOption = ({ className, children, ...props }: ComboboxOptionProps) => {
  return (
    <CatalystComboboxOption className={cn(className)} {...props}>
      {children}
    </CatalystComboboxOption>
  )
}

export const ComboboxLabel = ({ className, children, ...props }: ComboboxLabelProps) => {
  return (
    <CatalystComboboxLabel className={cn(className)} {...props}>
      {children}
    </CatalystComboboxLabel>
  )
}

export const ComboboxDescription = ({
  className,
  children,
  ...props
}: ComboboxDescriptionProps) => {
  return (
    <CatalystComboboxDescription className={cn(className)} {...props}>
      {children}
    </CatalystComboboxDescription>
  )
}

// Type exports
export type { ComboboxProps, ComboboxOptionProps, ComboboxLabelProps, ComboboxDescriptionProps }
