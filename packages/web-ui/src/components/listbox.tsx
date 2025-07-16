'use client'
import { type ComponentProps } from 'react'
import { cn } from './utils/cn'

// Import base Catalyst components
import {
  CatalystListbox,
  CatalystListboxOption,
  CatalystListboxLabel,
  CatalystListboxDescription,
} from './lib/catalyst-listbox'

// Type exports
export type ListboxProps<T = unknown> = ComponentProps<typeof CatalystListbox<T>>
export type ListboxOptionProps<T = unknown> = ComponentProps<typeof CatalystListboxOption<T>>
export type ListboxLabelProps = ComponentProps<typeof CatalystListboxLabel>
export type ListboxDescriptionProps = ComponentProps<typeof CatalystListboxDescription>

export const Listbox = <T,>({ className, children, ...props }: ListboxProps<T>) => (
  <CatalystListbox className={cn(className)} {...props}>
    {children}
  </CatalystListbox>
)

export const ListboxOption = <T,>({ className, children, ...props }: ListboxOptionProps<T>) => (
  <CatalystListboxOption className={cn(className)} {...props}>
    {children}
  </CatalystListboxOption>
)

export const ListboxLabel = ({ className, children, ...props }: ListboxLabelProps) => (
  <CatalystListboxLabel className={cn(className)} {...props}>
    {children}
  </CatalystListboxLabel>
)

export const ListboxDescription = ({ className, children, ...props }: ListboxDescriptionProps) => (
  <CatalystListboxDescription className={cn(className)} {...props}>
    {children}
  </CatalystListboxDescription>
)
