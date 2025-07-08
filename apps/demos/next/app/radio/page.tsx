'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Description, Fieldset, Label, Legend } from '@/components/th/fieldset';
import { Radio, RadioField, RadioGroup } from '@/components/th/radio';
import { Text } from '@/components/th/text';

export default function RadioPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Radio">
        <Item title="Default Radio">
          <Fieldset>
            <Legend>Resale and transfers</Legend>
            <Text>Decide if people buy tickets from you or from scalpers.</Text>
            <RadioGroup name="resale" defaultValue="permit">
              <RadioField>
                <Radio value="permit" />
                <Label>Allow tickets to be resold</Label>
                <Description>
                  Customers can resell or transfer their tickets if they can’t make it to the event.
                </Description>
              </RadioField>
              <RadioField>
                <Radio value="forbid" />
                <Label>Don’t allow tickets to be resold</Label>
                <Description>
                  Tickets cannot be resold or transferred to another person.
                </Description>
              </RadioField>
            </RadioGroup>
          </Fieldset>
        </Item>
      </List>
    </DemoLayout>
  );
}
