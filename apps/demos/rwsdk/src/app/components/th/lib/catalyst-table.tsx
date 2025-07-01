'use client'
// AUTO-GENERATED FILE - DO NOT MODIFY. This file is auto-generated and will be overwritten.

import type React from 'react'
import { createContext, useContext, useState } from 'react'
import { CatalystLink } from './catalyst-link'
import { SemanticColorToken, isSemanticToken, createSemanticTableStyles } from '../theme/index'
import { cn } from '../utils/cn'

const TableContext = createContext<{
  bleed: boolean
  dense: boolean
  grid: boolean
  striped: boolean
}>({
  bleed: false,
  dense: false,
  grid: false,
  striped: false,
})

export function CatalystTable({
  bleed = false,
  dense = false,
  grid = false,
  striped = false,
  className,
  children,
  color,
  ...props
}: {
  bleed?: boolean
  dense?: boolean
  grid?: boolean
  striped?: boolean
  color?: SemanticColorToken
} & React.ComponentPropsWithoutRef<'div'>) {
  const resolvedColorClasses =
    color && isSemanticToken(color) ? createSemanticTableStyles(color) : ''
  return (
    <TableContext.Provider
      value={{ bleed, dense, grid, striped } as React.ContextType<typeof TableContext>}
    >
      <div className={cn('flow-root', resolvedColorClasses)}>
        <div
          {...props}
          className={cn(
            '-mx-(--gutter) overflow-x-auto whitespace-nowrap',
            className,
            resolvedColorClasses
          )}
        >
          <div
            className={cn(
              'inline-block min-w-full align-middle',
              !bleed && 'sm:px-(--gutter)',
              resolvedColorClasses
            )}
          >
            <table
              className={cn(
                'min-w-full text-left text-sm/6 text-foreground dark:text-foreground',
                resolvedColorClasses
              )}
            >
              {children}
            </table>
          </div>
        </div>
      </div>
    </TableContext.Provider>
  )
}

export function CatalystTableHead({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'thead'>) {
  return (
    <thead
      {...props}
      className={cn('text-muted-foreground dark:text-muted-foreground', className)}
    />
  )
}

export function CatalystTableBody(props: React.ComponentPropsWithoutRef<'tbody'>) {
  return <tbody {...props} />
}

const TableRowContext = createContext<{ href?: string; target?: string; title?: string }>({
  href: undefined,
  target: undefined,
  title: undefined,
})

export function CatalystTableRow({
  href,
  target,
  title,
  className,
  ...props
}: { href?: string; target?: string; title?: string } & React.ComponentPropsWithoutRef<'tr'>) {
  let { striped } = useContext(TableContext)

  return (
    <TableRowContext.Provider
      value={{ href, target, title } as React.ContextType<typeof TableRowContext>}
    >
      <tr
        {...props}
        className={cn(
          href &&
            'has-[[data-row-link][data-focus]]:outline-2 has-[[data-row-link][data-focus]]:-outline-offset-2 has-[[data-row-link][data-focus]]:outline-primary dark:focus-within:bg-accent',
          striped && 'even:bg-muted/50 dark:even:bg-muted/25',
          href && striped && 'hover:bg-muted/75 dark:hover:bg-muted/50',
          href && !striped && 'hover:bg-muted/50 dark:hover:bg-muted/25',
          className
        )}
      />
    </TableRowContext.Provider>
  )
}

export function CatalystTableHeader({ className, ...props }: React.ComponentPropsWithoutRef<'th'>) {
  let { bleed, grid } = useContext(TableContext)

  return (
    <th
      {...props}
      className={cn(
        'border-b border-b-border px-4 py-2 font-medium first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2)) dark:border-b-border',
        grid && 'border-l border-l-border first:border-l-0',
        !bleed && 'sm:first:pl-1 sm:last:pr-1',
        className
      )}
    />
  )
}

export function CatalystTableCell({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'td'>) {
  let { bleed, dense, grid, striped } = useContext(TableContext)
  let { href, target, title } = useContext(TableRowContext)
  let [cellRef, setCellRef] = useState<HTMLElement | null>(null)

  return (
    <td
      ref={href ? setCellRef : undefined}
      {...props}
      className={cn(
        'relative px-4 first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2))',
        !striped && 'border-b border-border',
        grid && 'border-l border-l-border first:border-l-0',
        dense ? 'py-2.5' : 'py-4',
        !bleed && 'sm:first:pl-1 sm:last:pr-1',
        className
      )}
    >
      {href && (
        <CatalystLink
          data-row-link
          href={href}
          target={target}
          aria-label={title}
          tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
          className={cn('absolute inset-0 focus:outline-hidden')}
        />
      )}
      {children}
    </td>
  )
}
