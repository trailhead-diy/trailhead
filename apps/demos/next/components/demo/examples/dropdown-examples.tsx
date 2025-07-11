'use client';

import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../../th/dropdown';
import { ChevronDownIcon } from '@heroicons/react/16/solid';

const SimpleDropdown = () => {
  const deleteUser = () => {
    if (confirm('Are you sure you want to delete this user?')) {
      // ...
    }
  };
  return (
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
  );
};

import { List, Item } from '../demo-ui';

export function DropdownExamples() {
  return (
    <List
      title="Dropdown"
      description="Dropdown is used to display a list of options in a collapsible menu."
    >
      <Item title="Default Dropdown">
        <SimpleDropdown />
      </Item>
    </List>
  );
}
