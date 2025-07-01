import { forwardRef, type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystLink } from './lib/catalyst-link';

export type LinkProps = ComponentProps<typeof CatalystLink>;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystLink
      ref={ref}
      {...(className && { className: cn(className) })}
      {...props}
    >
      {children}
    </CatalystLink>
  ),
);

Link.displayName = 'Link';
