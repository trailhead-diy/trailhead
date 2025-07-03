import { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import {
  CatalystCheckbox,
  CatalystCheckboxGroup,
  CatalystCheckboxField,
} from './lib/catalyst-checkbox';

export type CheckboxProps = ComponentProps<typeof CatalystCheckbox>;
export type CheckboxGroupProps = ComponentProps<typeof CatalystCheckboxGroup>;
export type CheckboxFieldProps = ComponentProps<typeof CatalystCheckboxField>;

export const Checkbox = ({ className, children, ...props }: CheckboxProps) => (
  <CatalystCheckbox className={cn(className)} {...props}>
    {children}
  </CatalystCheckbox>
);

export const CheckboxGroup = ({ className, children, ...props }: CheckboxGroupProps) => (
  <CatalystCheckboxGroup className={cn(className)} {...props}>
    {children}
  </CatalystCheckboxGroup>
);

export const CheckboxField = ({ className, children, ...props }: CheckboxFieldProps) => (
  <CatalystCheckboxField className={cn(className)} {...props}>
    {children}
  </CatalystCheckboxField>
);
