import { type ComponentProps } from 'react'
import { CatalystAuthLayout } from './lib/catalyst-auth-layout'

export type AuthLayoutProps = ComponentProps<typeof CatalystAuthLayout>
export const AuthLayout = ({ children, ...props }: AuthLayoutProps) => (
  <CatalystAuthLayout {...props}>{children}</CatalystAuthLayout>
)
