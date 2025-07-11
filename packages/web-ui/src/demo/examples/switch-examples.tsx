'use client';

import { List, Item } from '../demo-ui';
import { Description, Label } from '../../../../components';
import { Switch, SwitchField } from '../../../../components';

export function SwitchExamples() {
  return (
    <List title="Switch">
      <Item title="Default Switch">
        <SimpleSwitch />
      </Item>
    </List>
  );
}

export const SimpleSwitch = () => (
  <SwitchField>
    <Label>Allow embedding</Label>
    <Description>Allow others to embed your event details on their own site.</Description>
    <Switch name="allow_embedding" defaultChecked />
  </SwitchField>
);
