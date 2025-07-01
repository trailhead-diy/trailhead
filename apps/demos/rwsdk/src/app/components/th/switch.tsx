import { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import {
  CatalystSwitch,
  CatalystSwitchGroup,
  CatalystSwitchField,
} from './lib/catalyst-switch';

export type SwitchProps = ComponentProps<typeof CatalystSwitch>;
export type SwitchGroupProps = ComponentProps<typeof CatalystSwitchGroup>;
export type SwitchFieldProps = ComponentProps<typeof CatalystSwitchField>;

export const Switch = ({ className, ...props }: SwitchProps) => (
  <CatalystSwitch className={cn(className)} {...props} />
);

export const SwitchGroup = ({
  className,
  children,
  ...props
}: SwitchGroupProps) => (
  <CatalystSwitchGroup className={cn(className)} {...props}>
    {children}
  </CatalystSwitchGroup>
);

export const SwitchField = ({
  className,
  children,
  ...props
}: SwitchFieldProps) => (
  <CatalystSwitchField className={cn(className)} {...props}>
    {children}
  </CatalystSwitchField>
);
