import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../table'

describe('Table Components', () => {
  it('should render accessible data table with semantic structure', () => {
    render(
      <Table aria-label="User data">
        <TableHead>
          <TableRow>
            <TableHeader scope="col">Name</TableHeader>
            <TableHeader scope="col">Email</TableHeader>
            <TableHeader scope="col">Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>Inactive</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    // Test semantic table structure
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // Test headers
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()

    // Test data cells
    expect(screen.getByRole('cell', { name: 'John Doe' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'jane@example.com' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Active' })).toBeInTheDocument()
  })

  it('should support table variants for different use cases', () => {
    render(
      <Table bleed striped dense>
        <TableBody>
          <TableRow>
            <TableCell>Compact content with visual styling</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.getByRole('cell', { name: 'Compact content with visual styling' })
    ).toBeInTheDocument()
  })
})
