'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/th/combobox';
import { Field, Label } from '@/components/th/fieldset';
export default function ComboboxPage(): React.JSX.Element {
  const currentUser = { id: '1', name: 'Esteban' };
  const users = [currentUser, { id: '2', name: 'John' }, { id: '3', name: 'Jane' }];
  return (
    <DemoLayout>
      <List title="Combobox">
        <Item title="Default Combobox">
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
        </Item>
      </List>
    </DemoLayout>
  );
}
