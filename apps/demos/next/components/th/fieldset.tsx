import { type ComponentProps } from 'react'
import { cn } from './utils/cn'
import {
  CatalystFieldset,
  CatalystLegend,
  CatalystField,
  CatalystFieldGroup,
  CatalystLabel,
  CatalystDescription,
  CatalystErrorMessage,
} from './lib/catalyst-fieldset'

export type FieldsetProps = ComponentProps<typeof CatalystFieldset>
export type LegendProps = ComponentProps<typeof CatalystLegend>
export type FieldGroupProps = ComponentProps<typeof CatalystFieldGroup>
export type FieldProps = ComponentProps<typeof CatalystField>
export type LabelProps = ComponentProps<typeof CatalystLabel>
export type DescriptionProps = ComponentProps<typeof CatalystDescription>
export type ErrorMessageProps = ComponentProps<typeof CatalystErrorMessage>

export const Fieldset = ({ className, children, ...props }: FieldsetProps) => (
  <CatalystFieldset {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystFieldset>
)

export const Legend = ({ className, children, ...props }: LegendProps) => (
  <CatalystLegend {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystLegend>
)

export const Field = ({ className, children, ...props }: FieldProps) => (
  <CatalystField {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystField>
)

export const FieldGroup = CatalystFieldGroup

export const Label = ({ className, children, ...props }: LabelProps) => (
  <CatalystLabel {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystLabel>
)

export const Description = ({ className, children, ...props }: DescriptionProps) => (
  <CatalystDescription {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystDescription>
)

export const ErrorMessage = ({ className, children, ...props }: ErrorMessageProps) => (
  <CatalystErrorMessage {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystErrorMessage>
)
