'use client';

import { Button } from '../../components/button';
import { List, Item } from '../demo-ui';

export function ButtonExamples() {
  return (
    <List title="Button">
      <Item title="Default Button">
        <SimpleButton />
      </Item>
    </List>
  );
}

export const SimpleButton = () => <Button>Save changes</Button>;
