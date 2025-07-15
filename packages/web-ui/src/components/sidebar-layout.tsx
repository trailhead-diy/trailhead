'use client'

import { type ComponentProps } from 'react'
import { CatalystSidebarLayout } from './lib/catalyst-sidebar-layout'

export type SidebarLayoutProps = ComponentProps<typeof CatalystSidebarLayout>

export const SidebarLayout = ({ children, navbar, sidebar }: SidebarLayoutProps) => (
  <CatalystSidebarLayout navbar={navbar} sidebar={sidebar}>
    {children}
  </CatalystSidebarLayout>
)
