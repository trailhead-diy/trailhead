'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Button } from '@/components/th/button';

export default function ButtonPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Button">
        <Item title="Default Button">
          <Button>Save changes</Button>
        </Item>
      </List>
    </DemoLayout>
  );
}
