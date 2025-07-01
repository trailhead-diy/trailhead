'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Badge } from '@/components/th/badge';

export default function BadgePage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Badge">
        <Item title="Default Badge">
          <div className="flex gap-3">
            <Badge color="lime">documentation</Badge>
            <Badge color="purple">help wanted</Badge>
            <Badge color="rose">bug</Badge>
          </div>
        </Item>
      </List>
    </DemoLayout>
  );
}
