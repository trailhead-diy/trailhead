import { forwardRef, type ComponentProps } from 'react';
import { cn } from './utils/cn';
import { CatalystAvatar, CatalystAvatarButton } from './lib/catalyst-avatar';

export type AvatarProps = ComponentProps<typeof CatalystAvatar>;
export type AvatarButtonProps = ComponentProps<typeof CatalystAvatarButton>;

export const Avatar = ({ className, children, ...props }: AvatarProps) => (
  <CatalystAvatar {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystAvatar>
);

export const AvatarButton = forwardRef<HTMLElement, AvatarButtonProps>(
  ({ className, ...props }, ref) => (
    <CatalystAvatarButton
      ref={ref}
      {...(className && { className: cn(className) })}
      {...props}
    />
  ),
);

AvatarButton.displayName = 'AvatarButton';
