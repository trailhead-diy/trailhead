import { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystHeading, CatalystSubheading } from './lib/catalyst-heading';

export type HeadingProps = ComponentProps<typeof CatalystHeading>;
export type SubheadingProps = ComponentProps<typeof CatalystSubheading>;

export const Heading = ({ className, children, ...props }: HeadingProps) => (
  <CatalystHeading className={cn(className)} {...props}>
    {children}
  </CatalystHeading>
);

export const Subheading = ({ className, children, ...props }: SubheadingProps) => (
  <CatalystSubheading className={cn(className)} {...props}>
    {children}
  </CatalystSubheading>
);
