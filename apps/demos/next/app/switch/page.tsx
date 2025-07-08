'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Description, Label } from '@/components/th/';
import { Switch, SwitchField } from '@/components/th/';

export default function SwitchPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Switch">
        <Item title="Default Switch">
          <SwitchField>
            <Label>Allow embedding</Label>
            <Description>Allow others to embed your event details on their own site.</Description>
            <Switch name="allow_embedding" defaultChecked />
          </SwitchField>
        </Item>
      </List>
    </DemoLayout>
  );
}
