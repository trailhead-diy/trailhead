'use client';
import { type ComponentProps } from 'react';
import { cn } from './utils/cn';
import {
  CatalystTable,
  CatalystTableHead,
  CatalystTableBody,
  CatalystTableRow,
  CatalystTableHeader,
  CatalystTableCell,
} from './lib/catalyst-table';

export type TableProps = ComponentProps<typeof CatalystTable>;
export type TableHeadProps = ComponentProps<typeof CatalystTableHead>;
export type TableBodyProps = ComponentProps<typeof CatalystTableBody>;
export type TableRowProps = ComponentProps<typeof CatalystTableRow>;
export type TableHeaderProps = ComponentProps<typeof CatalystTableHeader>;
export type TableCellProps = ComponentProps<typeof CatalystTableCell>;

export const Table = ({
  className,
  children,
  bleed,
  dense,
  grid,
  striped,
  ...props
}: TableProps) => (
  <CatalystTable
    bleed={bleed}
    dense={dense}
    grid={grid}
    striped={striped}
    {...(className && { className: cn(className) })}
    {...props}
  >
    {children}
  </CatalystTable>
);

export const TableHead = ({
  className,
  children,
  ...props
}: TableHeadProps) => (
  <CatalystTableHead
    {...(className && { className: cn(className) })}
    {...props}
  >
    {children}
  </CatalystTableHead>
);

export const TableBody = ({
  className,
  children,
  ...props
}: TableBodyProps) => (
  <CatalystTableBody
    {...(className && { className: cn(className) })}
    {...props}
  >
    {children}
  </CatalystTableBody>
);

export const TableRow = ({
  className,
  children,
  href,
  target,
  title,
  ...props
}: TableRowProps) => (
  <CatalystTableRow
    href={href}
    target={target}
    title={title}
    {...(className && { className: cn(className) })}
    {...props}
  >
    {children}
  </CatalystTableRow>
);

export const TableHeader = ({
  className,
  children,
  ...props
}: TableHeaderProps) => (
  <CatalystTableHeader
    {...(className && { className: cn(className) })}
    {...props}
  >
    {children}
  </CatalystTableHeader>
);

export const TableCell = ({
  className,
  children,
  ...props
}: TableCellProps) => (
  <CatalystTableCell
    {...(className && { className: cn(className) })}
    {...props}
  >
    {children}
  </CatalystTableCell>
);
