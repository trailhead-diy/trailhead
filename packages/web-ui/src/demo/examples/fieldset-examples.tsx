'use client';

import { Description, Field, FieldGroup, Fieldset, Label, Legend } from '../../components/fieldset';
import { Input } from '../../components/input';
import { Select } from '../../components/select';
import { Text } from '../../components/text';
import { Textarea } from '../../components/textarea';
import { List, Item } from '../demo-ui';

export function FieldsetExamples() {
  return (
    <List title="Fieldset">
      <Item title="Default Fieldset">
        <SimpleFieldset />
      </Item>
    </List>
  );
}

export const SimpleFieldset = () => (
  <form action="/orders" method="POST">
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
  </form>
);
