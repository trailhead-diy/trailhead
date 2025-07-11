'use client';

import {
  Pagination,
  PaginationGap,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from '../../components/pagination';
import { List, Item } from '../demo-ui';

export function PaginationExamples() {
  return (
    <List title="Pagination">
      <Item title="Default Pagination">
        <SimplePagination />
      </Item>
    </List>
  );
}

export const SimplePagination = () => (
  <Pagination>
    <PaginationPrevious href="?page=2" />
    <PaginationList>
      <PaginationPage href="?page=1">1</PaginationPage>
      <PaginationPage href="?page=2">2</PaginationPage>
      <PaginationPage href="?page=3" current>
        3
      </PaginationPage>
      <PaginationPage href="?page=4">4</PaginationPage>
      <PaginationGap />
      <PaginationPage href="?page=65">65</PaginationPage>
      <PaginationPage href="?page=66">66</PaginationPage>
    </PaginationList>
    <PaginationNext href="?page=4" />
  </Pagination>
);
