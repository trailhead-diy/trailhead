'use client';

import { forwardRef, type ComponentProps } from 'react';
import {
  CatalystSidebar,
  CatalystSidebarHeader,
  CatalystSidebarBody,
  CatalystSidebarFooter,
  CatalystSidebarSection,
  CatalystSidebarDivider,
  CatalystSidebarSpacer,
  CatalystSidebarHeading,
  CatalystSidebarItem,
  CatalystSidebarLabel,
} from './lib/catalyst-sidebar';
import { cn } from './utils/cn';

// Type exports
export type SidebarProps = ComponentProps<typeof CatalystSidebar>;
export type SidebarHeaderProps = ComponentProps<typeof CatalystSidebarHeader>;
export type SidebarBodyProps = ComponentProps<typeof CatalystSidebarBody>;
export type SidebarFooterProps = ComponentProps<typeof CatalystSidebarFooter>;
export type SidebarSectionProps = ComponentProps<typeof CatalystSidebarSection>;
export type SidebarDividerProps = ComponentProps<typeof CatalystSidebarDivider>;
export type SidebarSpacerProps = ComponentProps<typeof CatalystSidebarSpacer>;
export type SidebarHeadingProps = ComponentProps<typeof CatalystSidebarHeading>;
export type SidebarItemProps = ComponentProps<typeof CatalystSidebarItem>;
export type SidebarLabelProps = ComponentProps<typeof CatalystSidebarLabel>;

export const Sidebar = ({ className, children, ...props }: SidebarProps) => (
  <CatalystSidebar {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebar>
);

export const SidebarHeader = ({ className, children, ...props }: SidebarHeaderProps) => (
  <CatalystSidebarHeader {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarHeader>
);

export const SidebarBody = ({ className, children, ...props }: SidebarBodyProps) => (
  <CatalystSidebarBody {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarBody>
);

export const SidebarFooter = ({ className, children, ...props }: SidebarFooterProps) => (
  <CatalystSidebarFooter {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarFooter>
);

export const SidebarSection = ({ className, children, ...props }: SidebarSectionProps) => (
  <CatalystSidebarSection {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarSection>
);

export const SidebarDivider = ({ className, children, ...props }: SidebarDividerProps) => (
  <CatalystSidebarDivider {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarDivider>
);

export const SidebarSpacer = ({ className, children, ...props }: SidebarSpacerProps) => (
  <CatalystSidebarSpacer {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarSpacer>
);

export const SidebarHeading = ({ className, children, ...props }: SidebarHeadingProps) => (
  <CatalystSidebarHeading {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarHeading>
);

export const SidebarItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, SidebarItemProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystSidebarItem ref={ref} {...(className && { className: cn(className) })} {...props}>
      {children}
    </CatalystSidebarItem>
  )
);

SidebarItem.displayName = 'SidebarItem';

export const SidebarLabel = ({ className, children, ...props }: SidebarLabelProps) => (
  <CatalystSidebarLabel {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystSidebarLabel>
);
