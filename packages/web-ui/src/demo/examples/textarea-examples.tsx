'use client';

import { List, Item } from '../demo-ui';
import { Field, Label } from '../../components/fieldset';
import { Textarea } from '../../components/textarea';

export function TextareaExamples() {
  return (
    <List title="Textarea">
      <Item title="Default Textarea">
        <SimpleTextarea />
      </Item>
    </List>
  );
}

export const SimpleTextarea = () => (
  <Field>
    <Label>Description</Label>
    <Textarea name="description" />
  </Field>
);
