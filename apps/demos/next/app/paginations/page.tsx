'use client'
import { DemoLayout, Item, List } from '@/components/demo-layout'
import {
  Pagination,
  PaginationGap,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from '@/components/th/pagination'

export default function PaginationsPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Pagination">
        <Item title="Default Pagination">
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
        </Item>
      </List>
    </DemoLayout>
  )
}
