'use client';

import { Divider } from '../../th/divider';
import { List, Item } from '../demo-ui';

export function DividerExamples() {
  return (
    <List title="Divider">
      <Item title="Default Divider">
        <SimpleDivider />
      </Item>
    </List>
  );
}

export const SimpleDivider = () => <Divider />;
