import { ReactNode } from 'react';
import { ThemeProvider, ThemeSwitcher } from '@/components/th';
import { Navbar } from '@/components/th/navbar';
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from '@/components/th/sidebar';
import { SidebarLayout } from '@/components/th/sidebar-layout';

export const DemoLayout = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <ThemeSwitcher />
    <SidebarLayout
      navbar={<Navbar />}
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <SidebarSection className="max-lg:hidden">
              <SidebarItem href="/auth-layout">Auth Layout</SidebarItem>
              <SidebarItem href="/sidebar-layout">Sidebar Layout</SidebarItem>
              <SidebarItem href="/staked-layout">Staked Layout</SidebarItem>
            </SidebarSection>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection className="">
              <SidebarItem href="/alert">Alert</SidebarItem>
              <SidebarItem href="/avatar">Avatar</SidebarItem>
              <SidebarItem href="/badge">Badge</SidebarItem>
              <SidebarItem href="/button">Button</SidebarItem>
              <SidebarItem href="/checkbox">Checkbox</SidebarItem>
              <SidebarItem href="/combobox">Combobox</SidebarItem>
              <SidebarItem href="/description-list">
                Description List
              </SidebarItem>
              <SidebarItem href="/dialog">Dialog</SidebarItem>
              <SidebarItem href="/divider">Divider</SidebarItem>
              <SidebarItem href="/dropdown">Dropdown</SidebarItem>
              <SidebarItem href="/fieldset">Field Set</SidebarItem>
              <SidebarItem href="/heading">Heading</SidebarItem>
              <SidebarItem href="/input">Input</SidebarItem>
              <SidebarItem href="/listbox">Listbox</SidebarItem>
              <SidebarItem href="/navbar">Navbar</SidebarItem>
              <SidebarItem href="/paginations">Pagination</SidebarItem>
              <SidebarItem href="/radio">Radio</SidebarItem>
              <SidebarItem href="/select">Select</SidebarItem>
              <SidebarItem href="/sidebar">Sidebar</SidebarItem>
              <SidebarItem href="/switch">Switch</SidebarItem>
              <SidebarItem href="/table">Table</SidebarItem>
              <SidebarItem href="/text">Text</SidebarItem>
              <SidebarItem href="/textarea">Textarea</SidebarItem>
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  </ThemeProvider>
);

export const List = ({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) => (
  <>
    <h2 className="mb-4 text-2xl font-bold">{title}</h2>
    {description && (
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
    )}
    <ul className="flex flex-col gap-4">{children}</ul>
  </>
);
export const Item = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) => (
  <li className="p-4 bg-card border border-border rounded-lg shadow-sm">
    {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
    {children}
  </li>
);
