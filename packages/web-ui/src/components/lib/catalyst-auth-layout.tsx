// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.
import type React from 'react';

import { cn } from '../utils/cn';

export function CatalystAuthLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn('flex min-h-dvh flex-col p-2', className)}>
      <div
        className={cn(
          'flex grow items-center justify-center p-6 lg:rounded-lg lg:bg-white lg:p-10 lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10'
        )}
      >
        {children}
      </div>
    </main>
  );
}
