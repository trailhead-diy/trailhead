'use client';

import { Field, Label } from '../../components/fieldset';
import { Input } from '../../components/input';
import { List, Item } from '../demo-ui';

export function InputExamples() {
  return (
    <List title="Input">
      <Item title="Default Input">
        <SimpleInput />
      </Item>
    </List>
  );
}

export const SimpleInput = () => (
  <Field>
    <Label>Full name</Label>
    <Input name="full_name" />
  </Field>
);
