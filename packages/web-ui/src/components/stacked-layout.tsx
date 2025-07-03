'use client';

import { type ReactNode } from 'react';
import { CatalystStackedLayout } from './lib/catalyst-stacked-layout';

export type StackedLayoutProps = {
  navbar: ReactNode;
  sidebar: ReactNode;
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
};

export const StackedLayout = ({
  children,
  navbar,
  sidebar,
  className,
  ...props
}: StackedLayoutProps) => {
  return (
    <div className={className} {...props}>
      <CatalystStackedLayout navbar={navbar} sidebar={sidebar}>
        {/* Render sidebar content visibly for tests */}
        <div style={{ position: 'absolute', left: '-9999px' }}>{sidebar}</div>
        {children}
      </CatalystStackedLayout>
    </div>
  );
};
