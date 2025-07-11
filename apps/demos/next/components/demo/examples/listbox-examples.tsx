'use client';

import { Field, Label } from '../../th/fieldset';
import { Listbox, ListboxLabel, ListboxOption } from '../../th/listbox';
import { List, Item } from '../demo-ui';

export function ListboxExamples() {
  return (
    <List title="Listbox">
      <Item title="Default Listbox">
        <SimpleListbox />
      </Item>
    </List>
  );
}

export const SimpleListbox = () => (
  <Field>
    <Label>Project status</Label>
    <Listbox name="status" defaultValue="active">
      <ListboxOption value="active">
        <ListboxLabel>Active</ListboxLabel>
      </ListboxOption>
      <ListboxOption value="paused">
        <ListboxLabel>Paused</ListboxLabel>
      </ListboxOption>
      <ListboxOption value="delayed">
        <ListboxLabel>Delayed</ListboxLabel>
      </ListboxOption>
      <ListboxOption value="canceled">
        <ListboxLabel>Canceled</ListboxLabel>
      </ListboxOption>
    </Listbox>
  </Field>
);
