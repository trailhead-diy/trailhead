'use client'
import { forwardRef, type ComponentProps } from 'react'
import { cn } from './utils/cn'
import {
  CatalystNavbar,
  CatalystNavbarDivider,
  CatalystNavbarSection,
  CatalystNavbarSpacer,
  CatalystNavbarItem,
  CatalystNavbarLabel,
} from './lib/catalyst-navbar'

export type NavbarProps = ComponentProps<typeof CatalystNavbar>
export type NavbarDividerProps = ComponentProps<typeof CatalystNavbarDivider>
export type NavbarSectionProps = ComponentProps<typeof CatalystNavbarSection>
export type NavbarSpacerProps = ComponentProps<typeof CatalystNavbarSpacer>
export type NavbarItemProps = ComponentProps<typeof CatalystNavbarItem>
export type NavbarLabelProps = ComponentProps<typeof CatalystNavbarLabel>

export const Navbar = ({ className, children, ...props }: NavbarProps) => (
  <CatalystNavbar className={cn(className)} {...props}>
    {children}
  </CatalystNavbar>
)

export const NavbarDivider = ({ className, ...props }: NavbarDividerProps) => (
  <CatalystNavbarDivider className={cn(className)} {...props} />
)

export const NavbarSection = ({ className, children, ...props }: NavbarSectionProps) => (
  <CatalystNavbarSection className={cn(className)} {...props}>
    {children}
  </CatalystNavbarSection>
)

export const NavbarSpacer = ({ className, ...props }: NavbarSpacerProps) => (
  <CatalystNavbarSpacer className={cn(className)} {...props} />
)

export const NavbarItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, NavbarItemProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystNavbarItem ref={ref} className={cn(className)} {...props}>
      {children}
    </CatalystNavbarItem>
  )
)

NavbarItem.displayName = 'NavbarItem'

export const NavbarLabel = ({ className, children, ...props }: NavbarLabelProps) => (
  <CatalystNavbarLabel className={cn(className)} {...props}>
    {children}
  </CatalystNavbarLabel>
)
