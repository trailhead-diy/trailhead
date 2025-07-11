'use client';

import { Combobox, ComboboxLabel, ComboboxOption } from '../../components/combobox';
import { Field, Label } from '../../components/fieldset';
import { List, Item } from '../demo-ui';

export function ComboboxExamples() {
  return (
    <List title="Combobox">
      <Item title="Default Combobox">
        <SimpleCombobox />
      </Item>
    </List>
  );
}

export const SimpleCombobox = () => {
  const currentUser = { id: '1', name: 'Esteban' };
  const users = [currentUser, { id: '2', name: 'John' }, { id: '3', name: 'Jane' }];
  return (
    <Field>
      <Label>Assigned to</Label>
      <Combobox
        name="user"
        options={users}
        displayValue={user => user?.name}
        defaultValue={currentUser}
      >
        {user => (
          <ComboboxOption value={user}>
            <ComboboxLabel>{user.name}</ComboboxLabel>
          </ComboboxOption>
        )}
      </Combobox>
    </Field>
  );
};
