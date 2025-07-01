'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/th/table';

export default function TablePage(): React.JSX.Element {
  const users = [
    {
      name: 'Esteban Herrera',
      email: 'esteban@example.com',
      role: 'Admin',
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'User',
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'User',
    },
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'User',
    },
    {
      name: 'Bob Brown',
      email: 'bob@example.com',
      role: 'User',
    },
    {
      name: 'Charlie White',
      email: 'charlie@example.com',
      role: 'User',
    },
    {
      name: 'Diana Green',
      email: 'diana@example.com',
      role: 'User',
    },
  ];
  return (
    <DemoLayout>
      <List title="Table">
        <Item title="Default Table">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-zinc-500">{user.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Item>
      </List>
    </DemoLayout>
  );
}
