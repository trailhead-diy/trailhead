'use client';

import { Badge } from '../../th/badge';
import { List, Item } from '../demo-ui';

const SimpleBadge = () => (
  <div className="flex gap-3">
    <Badge color="lime">doc</Badge>
    <Badge color="purple">help</Badge>
    <Badge color="rose">bug</Badge>
  </div>
);

export function BadgeExamples() {
  return (
    <List title="Badge" description="Badge component for displaying status or labels.">
      <Item title="Default Badge">
        <SimpleBadge />
      </Item>
    </List>
  );
}
