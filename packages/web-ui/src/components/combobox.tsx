'use client';
import React, { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import {
  CatalystCombobox,
  CatalystComboboxOption,
  CatalystComboboxLabel,
  CatalystComboboxDescription,
} from './lib/catalyst-combobox';

export type ComboboxProps<T = unknown> = ComponentProps<typeof CatalystCombobox<T>>;
export type ComboboxOptionProps<T = unknown> = ComponentProps<typeof CatalystComboboxOption<T>>;
export type ComboboxLabelProps = ComponentProps<typeof CatalystComboboxLabel>;
export type ComboboxDescriptionProps = ComponentProps<typeof CatalystComboboxDescription>;

export const Combobox = <T,>({ className, children, ...props }: ComboboxProps<T>) => {
  return (
    <CatalystCombobox {...(className && { className: cn(className) })} {...props}>
      {children}
    </CatalystCombobox>
  );
};

export const ComboboxOption = <T,>({ className, children, ...props }: ComboboxOptionProps<T>) => (
  <CatalystComboboxOption className={cn(className)} {...props}>
    {children}
  </CatalystComboboxOption>
);

export const ComboboxLabel = ({ className, children, ...props }: ComboboxLabelProps) => (
  <CatalystComboboxLabel className={cn(className)} {...props}>
    {children}
  </CatalystComboboxLabel>
);

export const ComboboxDescription = ({
  className,
  children,
  ...props
}: ComboboxDescriptionProps) => (
  <CatalystComboboxDescription className={cn(className)} {...props}>
    {children}
  </CatalystComboboxDescription>
);
