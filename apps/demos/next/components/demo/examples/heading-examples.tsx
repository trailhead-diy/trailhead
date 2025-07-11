'use client';

import { Button } from '../../th/button';
import { Heading } from '../../th/heading';
import { List, Item } from '../demo-ui';

export function HeadingExamples() {
  return (
    <List title="Heading">
      <Item title="Default Heading">
        <SimpleHeading />
      </Item>
    </List>
  );
}

export const SimpleHeading = () => (
  <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-6 dark:border-white/10">
    <Heading>Order #1011</Heading>
    <div className="flex gap-4">
      <Button outline>Refund</Button>
      <Button>Resend invoice</Button>
    </div>
  </div>
);
