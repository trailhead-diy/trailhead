'use client';

import { List, Item } from '../demo-ui';
import { Strong, Text, TextLink } from '../../th/text';

export function TextExamples() {
  return (
    <List title="Text">
      <Item title="Default Text">
        <SimpleText />
      </Item>
    </List>
  );
}

export const SimpleText = () => (
  <Text>
    This feature is only available to users on the <Strong>Business Plan</Strong>. To upgrade, visit
    your <TextLink href="#">billing settings</TextLink>.
  </Text>
);
