import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Pagination,
  PaginationPrevious,
  PaginationNext,
  PaginationList,
  PaginationPage,
  PaginationGap,
} from '../../src/components/pagination';

describe('Pagination Components', () => {
  it('should render accessible pagination with current page indication', () => {
    render(
      <Pagination aria-label="Search results pagination">
        <PaginationPrevious href="/page/1">Previous</PaginationPrevious>
        <PaginationList>
          <PaginationPage href="/page/1">1</PaginationPage>
          <PaginationPage href="/page/2" current>
            2
          </PaginationPage>
          <PaginationPage href="/page/3">3</PaginationPage>
          <PaginationGap>…</PaginationGap>
          <PaginationPage href="/page/10">10</PaginationPage>
        </PaginationList>
        <PaginationNext href="/page/3">Next</PaginationNext>
      </Pagination>
    );

    // Test links
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute('href', '/page/1');
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '/page/3');

    // Test current page
    const currentPage = screen.getByText('2');
    expect(currentPage.closest('a')).toHaveAttribute('aria-current', 'page');
  });
});
