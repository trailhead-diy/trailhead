'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Avatar } from '@/components/th';

export default function AvatarPage(): React.JSX.Element {
  const user = {
    avatarUrl: 'https://trailheadui.com/images/avatar-1.jpg',
  };
  return (
    <DemoLayout>
      <List title="Avatar">
        <Item title="Default Avatar">
          <Avatar className="size-6" src={user.avatarUrl} />
          <Avatar className="size-8" src={user.avatarUrl} />
          <Avatar className="size-10" src={user.avatarUrl} />
        </Item>
      </List>
    </DemoLayout>
  );
}
