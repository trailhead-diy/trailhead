'use client'

import { type ComponentProps } from 'react'
import { cn } from './utils/cn'
import {
  CatalystAlert,
  CatalystAlertTitle,
  CatalystAlertDescription,
  CatalystAlertBody,
  CatalystAlertActions,
} from './lib/catalyst-alert'

export type AlertProps = ComponentProps<typeof CatalystAlert>
export type AlertTitleProps = ComponentProps<typeof CatalystAlertTitle>
export type AlertDescriptionProps = ComponentProps<typeof CatalystAlertDescription>
export type AlertBodyProps = ComponentProps<typeof CatalystAlertBody>
export type AlertActionsProps = ComponentProps<typeof CatalystAlertActions>

export const Alert = ({ className, children, ...props }: AlertProps) => (
  <CatalystAlert className={cn(className)} {...props}>
    {children}
  </CatalystAlert>
)

export const AlertTitle = ({ className, children, ...props }: AlertTitleProps) => (
  <CatalystAlertTitle className={cn(className)} {...props}>
    {children}
  </CatalystAlertTitle>
)

export const AlertDescription = ({ className, children, ...props }: AlertDescriptionProps) => (
  <CatalystAlertDescription className={cn(className)} {...props}>
    {children}
  </CatalystAlertDescription>
)

export const AlertBody = ({ className, children, ...props }: AlertBodyProps) => (
  <CatalystAlertBody className={cn(className)} {...props}>
    {children}
  </CatalystAlertBody>
)

export const AlertActions = ({ className, children, ...props }: AlertActionsProps) => (
  <CatalystAlertActions className={cn(className)} {...props}>
    {children}
  </CatalystAlertActions>
)
