import { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import {
  CatalystText,
  CatalystTextLink,
  CatalystStrong,
  CatalystCode,
} from './lib/catalyst-text';

export type TextProps = ComponentProps<typeof CatalystText>;
export type TextLinkProps = ComponentProps<typeof CatalystTextLink>;
export type StrongProps = ComponentProps<typeof CatalystStrong>;
export type CodeProps = ComponentProps<typeof CatalystCode>;

/**
 * Text - Display text content with consistent styling
 *
 * A thin wrapper around Catalyst's Text component that provides
 * consistent theming and enhanced TypeScript support.
 */
export const Text = ({ className, children, ...props }: TextProps) => (
  <CatalystText className={cn(className)} {...props}>
    {children}
  </CatalystText>
);

export const TextLink = ({ className, children, ...props }: TextLinkProps) => (
  <CatalystTextLink className={cn(className)} {...props}>
    {children}
  </CatalystTextLink>
);

export const Strong = ({ className, children, ...props }: StrongProps) => (
  <CatalystStrong className={cn(className)} {...props}>
    {children}
  </CatalystStrong>
);

export const Code = ({ className, children, ...props }: CodeProps) => (
  <CatalystCode className={cn(className)} {...props}>
    {children}
  </CatalystCode>
);
