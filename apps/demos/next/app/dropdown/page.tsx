'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/th/dropdown';
import { ChevronDownIcon } from '@heroicons/react/16/solid';

export default function DropdownPage(): React.JSX.Element {
  function deleteUser() {
    if (confirm('Are you sure you want to delete this user?')) {
      // ...
    }
  }
  return (
    <DemoLayout>
      <List title="Dropdown">
        <Item title="Default Dropdown">
          <Dropdown>
            <DropdownButton outline>
              Options
              <ChevronDownIcon />
            </DropdownButton>
            <DropdownMenu>
              <DropdownItem href="/users/1">View</DropdownItem>
              <DropdownItem href="/users/1/edit">Edit</DropdownItem>
              <DropdownItem onClick={() => deleteUser()}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </Item>
      </List>
    </DemoLayout>
  );
}
