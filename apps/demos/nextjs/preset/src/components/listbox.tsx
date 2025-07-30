'use client'

import { type ComponentProps } from 'react'
import * as Headless from '@headlessui/react'
import { cn } from './utils/cn'
import {
  CatalystListbox,
  CatalystListboxOption,
  CatalystListboxLabel,
  CatalystListboxDescription,
} from './lib/catalyst-listbox'

type ListboxProps = ComponentProps<typeof CatalystListbox>
type ListboxOptionProps = ComponentProps<typeof CatalystListboxOption>
type ListboxLabelProps = ComponentProps<typeof CatalystListboxLabel>
type ListboxDescriptionProps = ComponentProps<typeof CatalystListboxDescription>

// HeadlessUI exports for components not wrapped by Catalyst
type ListboxButtonProps = ComponentProps<typeof Headless.ListboxButton>
type ListboxOptionsProps = ComponentProps<typeof Headless.ListboxOptions>

export const Listbox = ({ className, children, ...props }: ListboxProps) => (
  <CatalystListbox className={cn(className)} {...props}>
    {children}
  </CatalystListbox>
)

// These components come directly from HeadlessUI since Catalyst doesn't wrap them
export const ListboxButton = ({ className, children, ...props }: ListboxButtonProps) => {
  return (
    <Headless.ListboxButton className={cn(className)} {...props}>
      {children}
    </Headless.ListboxButton>
  )
}

export const ListboxOptions = ({ className, children, ...props }: ListboxOptionsProps) => {
  return (
    <Headless.ListboxOptions className={cn(className)} {...props}>
      {children}
    </Headless.ListboxOptions>
  )
}

export const ListboxOption = ({ className, children, ...props }: ListboxOptionProps) => (
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

// Type exports
export type {
  ListboxProps,
  ListboxButtonProps,
  ListboxOptionsProps,
  ListboxOptionProps,
  ListboxLabelProps,
  ListboxDescriptionProps,
}
