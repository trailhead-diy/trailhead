import { type ComponentProps } from 'react'
import { cn } from './utils/cn'

// Import base Catalyst components
import {
  CatalystPagination,
  CatalystPaginationPrevious,
  CatalystPaginationNext,
  CatalystPaginationList,
  CatalystPaginationPage,
  CatalystPaginationGap,
} from './lib/catalyst-pagination'

// Type exports
export type PaginationProps = ComponentProps<typeof CatalystPagination>
export type PaginationPreviousProps = ComponentProps<typeof CatalystPaginationPrevious>
export type PaginationNextProps = ComponentProps<typeof CatalystPaginationNext>
export type PaginationListProps = ComponentProps<typeof CatalystPaginationList>
export type PaginationPageProps = ComponentProps<typeof CatalystPaginationPage>
export type PaginationGapProps = ComponentProps<typeof CatalystPaginationGap>

export const Pagination = ({
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: PaginationProps) => (
  <CatalystPagination aria-label={ariaLabel} className={cn(className)} {...props}>
    {children}
  </CatalystPagination>
)

export const PaginationPrevious = ({ className, children, ...props }: PaginationPreviousProps) => (
  <CatalystPaginationPrevious className={cn(className)} {...props}>
    {children}
  </CatalystPaginationPrevious>
)

export const PaginationNext = ({ className, children, ...props }: PaginationNextProps) => (
  <CatalystPaginationNext className={cn(className)} {...props}>
    {children}
  </CatalystPaginationNext>
)

export const PaginationList = ({ className, children, ...props }: PaginationListProps) => (
  <CatalystPaginationList className={cn(className)} {...props}>
    {children}
  </CatalystPaginationList>
)

export const PaginationPage = ({ className, children, ...props }: PaginationPageProps) => (
  <CatalystPaginationPage className={cn(className)} {...props}>
    {children}
  </CatalystPaginationPage>
)

export const PaginationGap = ({ className, children, ...props }: PaginationGapProps) => (
  <CatalystPaginationGap className={cn(className)} {...props}>
    {children}
  </CatalystPaginationGap>
)
