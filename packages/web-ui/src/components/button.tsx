import { forwardRef } from 'react';
import { cn } from './utils/cn';
import { CatalystButton, type CatalystButtonProps } from './lib/catalyst-button';

export type ButtonProps = CatalystButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <CatalystButton
      ref={ref as React.ForwardedRef<HTMLElement>}
      {...(className && { className: cn(className) })}
      {...props}
    >
      {children}
    </CatalystButton>
  )
);

Button.displayName = 'Button';
