'use client';

import { Link } from '../../components/link';
import { List, Item } from '../demo-ui';

export function LinkExamples() {
  return (
    <List title="Link">
      <Item title="Basic Link">
        <Link href="#">Basic link</Link>
      </Item>
      <Item title="External Link">
        <Link href="https://example.com" target="_blank" rel="noopener noreferrer">
          External link
        </Link>
      </Item>
    </List>
  );
}
