import { type ComponentProps } from 'react'
import { cn } from './utils/cn'
import {
  CatalystDialog,
  CatalystDialogTitle,
  CatalystDialogDescription,
  CatalystDialogBody,
  CatalystDialogActions,
} from './lib/catalyst-dialog'

export type DialogProps = ComponentProps<typeof CatalystDialog>
export type DialogTitleProps = ComponentProps<typeof CatalystDialogTitle>
export type DialogDescriptionProps = ComponentProps<typeof CatalystDialogDescription>
export type DialogBodyProps = ComponentProps<typeof CatalystDialogBody>
export type DialogActionsProps = ComponentProps<typeof CatalystDialogActions>

export const Dialog = ({ className, children, ...props }: DialogProps) => (
  <CatalystDialog className={cn(className)} {...props}>
    {children}
  </CatalystDialog>
)

export const DialogTitle = ({ className, children, ...props }: DialogTitleProps) => (
  <CatalystDialogTitle className={cn(className)} {...props}>
    {children}
  </CatalystDialogTitle>
)

export const DialogDescription = ({ className, children, ...props }: DialogDescriptionProps) => (
  <CatalystDialogDescription className={cn(className)} {...props}>
    {children}
  </CatalystDialogDescription>
)

export const DialogBody = ({ className, children, ...props }: DialogBodyProps) => (
  <CatalystDialogBody className={cn(className)} {...props}>
    {children}
  </CatalystDialogBody>
)

export const DialogActions = ({ className, children, ...props }: DialogActionsProps) => (
  <CatalystDialogActions className={cn(className)} {...props}>
    {children}
  </CatalystDialogActions>
)
