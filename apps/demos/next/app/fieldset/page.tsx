'use client'
import { DemoLayout, Item, List } from '@/components/demo-layout'
import { Description, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/th/fieldset'
import { Input } from '@/components/th/input'
import { Select } from '@/components/th/select'
import { Text } from '@/components/th/text'
import { Textarea } from '@/components/th/textarea'

export default function FieldsetPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Fieldset">
        <Item title="Default Fieldset">
          <form action="/orders" method="POST">
            {/* ... */}
            <Fieldset>
              <Legend>Shipping details</Legend>
              <Text>Without this your odds of getting your order are low.</Text>
              <FieldGroup>
                <Field>
                  <Label>Street address</Label>
                  <Input name="street_address" />
                </Field>
                <Field>
                  <Label>Country</Label>
                  <Select name="country">
                    <option>Canada</option>
                    <option>Mexico</option>
                    <option>United States</option>
                  </Select>
                  <Description>We currently only ship to North America.</Description>
                </Field>
                <Field>
                  <Label>Delivery notes</Label>
                  <Textarea name="notes" />
                  <Description>If you have a tiger, we&apos;d like to know about it.</Description>
                </Field>
              </FieldGroup>
            </Fieldset>
            {/* ... */}
          </form>
        </Item>
      </List>
    </DemoLayout>
  )
}
