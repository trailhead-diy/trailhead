'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Field, Label } from '@/components/th/fieldset';
import { Textarea } from '@/components/th/textarea';

export default function TextareaPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Text">
        <Item title="Default Text">
          <Field>
            <Label>Description</Label>
            <Textarea name="description" />
          </Field>
        </Item>
      </List>
    </DemoLayout>
  );
}
