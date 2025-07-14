'use client'
import { DemoLayout, Item, List } from '@/components/demo-layout'
import { Field, Label } from '@/components/th/fieldset'
import { Input } from '@/components/th/input'

export default function InputPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Input">
        <Item title="Default Input">
          <Field>
            <Label>Full name</Label>
            <Input name="full_name" />
          </Field>
        </Item>
      </List>
    </DemoLayout>
  )
}
