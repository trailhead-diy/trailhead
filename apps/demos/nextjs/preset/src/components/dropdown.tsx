'use client'
import * as Headless from '@headlessui/react'
import { JSX, type ComponentProps } from 'react'
import { cn } from './utils/cn'

import { CatalystButton } from './lib/catalyst-button'
import {
  CatalystDropdown,
  CatalystDropdownButton,
  CatalystDropdownDescription,
  CatalystDropdownDivider,
  CatalystDropdownHeader,
  CatalystDropdownHeading,
  CatalystDropdownItem,
  CatalystDropdownLabel,
  CatalystDropdownMenu,
  CatalystDropdownSection,
  CatalystDropdownShortcut,
} from './lib/catalyst-dropdown'

export type DropdownProps = ComponentProps<typeof CatalystDropdown>

// Default case: no 'as' prop, uses CatalystButton
export type DropdownButtonProps = {
  className?: string
} & Omit<React.ComponentProps<typeof CatalystButton>, 'className'>

// Custom component case: 'as' prop provided
export type DropdownButtonPropsWithAs<T extends React.ElementType> = {
  className?: string
  as: T
} & Omit<Headless.MenuButtonProps<T>, 'className'>
export type DropdownMenuProps = ComponentProps<typeof CatalystDropdownMenu>
export type DropdownItemProps = ComponentProps<typeof CatalystDropdownItem>
export type DropdownLabelProps = ComponentProps<typeof CatalystDropdownLabel>
export type DropdownDescriptionProps = ComponentProps<typeof CatalystDropdownDescription>
export type DropdownHeaderProps = ComponentProps<typeof CatalystDropdownHeader>
export type DropdownSectionProps = ComponentProps<typeof CatalystDropdownSection>
export type DropdownHeadingProps = ComponentProps<typeof CatalystDropdownHeading>
export type DropdownDividerProps = ComponentProps<typeof CatalystDropdownDivider>
export type DropdownShortcutProps = { keys: string | string[]; className?: string } & Omit<
  Headless.DescriptionProps<'kbd'>,
  'as' | 'className'
>

export const Dropdown = ({ children, ...props }: DropdownProps) => (
  <CatalystDropdown {...props}>{children}</CatalystDropdown>
)

// Function overloads for DropdownButton
export function DropdownButton(props: DropdownButtonProps): JSX.Element
export function DropdownButton<T extends React.ElementType>(
  props: DropdownButtonPropsWithAs<T>
): JSX.Element
export function DropdownButton({
  className,
  children,
  ...props
}: DropdownButtonProps | DropdownButtonPropsWithAs<any>) {
  const Component = props.as || 'button'

  return (
    <CatalystDropdownButton className={cn(className)} {...props}>
      {children}
    </CatalystDropdownButton>
  )
}

export const DropdownMenu = ({ className, children, anchor, ...props }: DropdownMenuProps) => (
  <CatalystDropdownMenu anchor={anchor} className={cn(className)} {...props}>
    {children}
  </CatalystDropdownMenu>
)

export const DropdownItem = ({ className, children, ...props }: DropdownItemProps) => (
  <CatalystDropdownItem className={cn(className)} {...props}>
    {children}
  </CatalystDropdownItem>
)

export const DropdownLabel = ({ className, children, ...props }: DropdownLabelProps) => (
  <CatalystDropdownLabel className={cn(className)} {...props}>
    {children}
  </CatalystDropdownLabel>
)

export const DropdownHeader = ({ className, children, ...props }: DropdownHeaderProps) => (
  <CatalystDropdownHeader className={cn(className)} {...props}>
    {children}
  </CatalystDropdownHeader>
)

export const DropdownSection = ({ className, children, ...props }: DropdownSectionProps) => (
  <CatalystDropdownSection className={cn(className)} {...props}>
    {children}
  </CatalystDropdownSection>
)

export const DropdownHeading = ({ className, children, ...props }: DropdownHeadingProps) => (
  <CatalystDropdownHeading className={cn(className)} {...props}>
    {children}
  </CatalystDropdownHeading>
)

export const DropdownDivider = ({ className, ...props }: DropdownDividerProps) => (
  <CatalystDropdownDivider className={cn(className)} {...props} />
)

export const DropdownShortcut = ({ className, keys, ...props }: DropdownShortcutProps) => (
  <CatalystDropdownShortcut className={cn(className)} keys={keys} {...props} />
)

export const DropdownDescription = ({
  className,
  children,
  ...props
}: DropdownDescriptionProps) => (
  <CatalystDropdownDescription className={cn(className)} {...props}>
    {children}
  </CatalystDropdownDescription>
)
