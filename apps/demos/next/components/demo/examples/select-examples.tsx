'use client';

import { Field, Label } from '../../th/fieldset';
import { Select } from '../../th/select';
import { List, Item } from '../demo-ui';

export function SelectExamples() {
  return (
    <List title="Select">
      <Item title="Default Select">
        <SimpleSelect />
      </Item>
    </List>
  );
}

export const SimpleSelect = () => (
  <Field>
    <Label>Project status</Label>
    <Select name="status">
      <option value="active">Active</option>
      <option value="paused">Paused</option>
      <option value="delayed">Delayed</option>
      <option value="canceled">Canceled</option>
    </Select>
  </Field>
);
