'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Field, Label } from '@/components/th/fieldset';
import { Select } from '@/components/th/select';

export default function SidebarPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Sidebar">
        <Item title="Default Sidebar">
          <Field>
            <Label>Project status</Label>
            <Select name="status">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="delayed">Delayed</option>
              <option value="canceled">Canceled</option>
            </Select>
          </Field>
        </Item>
      </List>
    </DemoLayout>
  );
}
