import { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystDivider } from './lib/catalyst-divider';

export type DividerProps = ComponentProps<typeof CatalystDivider>;

export const Divider = ({ className, ...props }: DividerProps) => (
  <CatalystDivider className={cn(className)} {...props} />
);
