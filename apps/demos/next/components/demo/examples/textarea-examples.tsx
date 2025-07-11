'use client';

import { List, Item } from '../demo-ui';
import { Field, Label } from '../../th/fieldset';
import { Textarea } from '../../th/textarea';

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
