'use client'
import { DemoLayout, Item, List } from '@/components/demo-layout'
import { Field, Label } from '@/components/th/fieldset'
import { Listbox, ListboxLabel, ListboxOption } from '@/components/th/listbox'

export default function ListboxPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Listbox">
        <Item title="Default Listbox">
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
        </Item>
      </List>
    </DemoLayout>
  )
}
