'use client';

import { Avatar } from '../../th';
import { List, Item } from '../demo-ui';

export function AvatarExamples() {
  return (
    <List title="Avatar">
      <Item title="Default Avatar">
        <SimpleAvatar />
      </Item>
    </List>
  );
}

export const SimpleAvatar = () => {
  const user = {
    avatarUrl: 'https://trailheadui.com/images/avatar-1.jpg',
  };
  return (
    <>
      <Avatar className="size-6" src={user.avatarUrl} />
      <Avatar className="size-8" src={user.avatarUrl} />
      <Avatar className="size-10" src={user.avatarUrl} />
    </>
  );
};
