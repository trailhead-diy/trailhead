import { type ComponentProps } from 'react'
import { cn } from './utils/cn'
import {
  CatalystDescriptionList,
  CatalystDescriptionTerm,
  CatalystDescriptionDetails,
} from './lib/catalyst-description-list'

export type DescriptionListProps = ComponentProps<typeof CatalystDescriptionList>
export type DescriptionTermProps = ComponentProps<typeof CatalystDescriptionTerm>
export type DescriptionDetailsProps = ComponentProps<typeof CatalystDescriptionDetails>

export const DescriptionList = ({ className, children, ...props }: DescriptionListProps) => (
  <CatalystDescriptionList {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystDescriptionList>
)

export const DescriptionTerm = ({ className, children, ...props }: DescriptionTermProps) => (
  <CatalystDescriptionTerm {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystDescriptionTerm>
)

export const DescriptionDetails = ({ className, children, ...props }: DescriptionDetailsProps) => (
  <CatalystDescriptionDetails {...(className && { className: cn(className) })} {...props}>
    {children}
  </CatalystDescriptionDetails>
)
