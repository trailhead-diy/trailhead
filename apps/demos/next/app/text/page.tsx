'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Strong, Text, TextLink } from '@/components/th/text';

export default function TextPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Text">
        <Item title="Default Text">
          <Text>
            This feature is only available to users on the{' '}
            <Strong>Business Plan</Strong>. To upgrade, visit your{' '}
            <TextLink href="#">billing settings</TextLink>.
          </Text>
        </Item>
      </List>
    </DemoLayout>
  );
}
