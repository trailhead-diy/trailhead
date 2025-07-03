import { forwardRef, type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystBadge, CatalystBadgeButton } from './lib/catalyst-badge';

export type BadgeProps = ComponentProps<typeof CatalystBadge>;
export type BadgeButtonProps = ComponentProps<typeof CatalystBadgeButton>;

export const Badge = ({ className, children, ...props }: BadgeProps) => (
  <CatalystBadge className={cn(className)} {...props}>
    {children}
  </CatalystBadge>
);

export const BadgeButton = forwardRef<HTMLElement, BadgeButtonProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystBadgeButton ref={ref} className={cn(className)} {...props}>
      {children}
    </CatalystBadgeButton>
  )
);

BadgeButton.displayName = 'BadgeButton';
