import { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystAuthLayout } from './lib/catalyst-auth-layout';

export type AuthLayoutProps = ComponentProps<typeof CatalystAuthLayout>;
export const AuthLayout = ({ className, children, ...props }: AuthLayoutProps) => (
  <CatalystAuthLayout className={cn(className)} {...props}>
    {children}
  </CatalystAuthLayout>
);
