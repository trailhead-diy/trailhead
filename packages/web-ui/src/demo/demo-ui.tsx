import { ReactNode } from 'react';
import { ThemeProvider, ThemeSwitcher } from '../components/theme/';
import { Navbar } from '../components/navbar';
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from '../components/sidebar';
import { SidebarLayout } from '../components/sidebar-layout';

export const List = ({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description?: string;
}) => (
  <>
    <h2 className="mb-4 text-2xl font-bold">{title}</h2>
    {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
    <ul className="flex flex-col gap-4">{children}</ul>
  </>
);

export const Item = ({ children, title }: { children: ReactNode; title?: string }) => (
  <li className="p-4 bg-card border border-border rounded-lg shadow-sm">
    {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
    {children}
  </li>
);

// Hardcode navigation items - add new ones here
const layouts = [
  { name: 'Auth Layout', href: '/auth-layout' },
  { name: 'Sidebar Layout', href: '/sidebar-layout' },
  { name: 'Stacked Layout', href: '/stacked-layout' },
];

const components = [
  { name: 'Alert', href: '/alert' },
  { name: 'Avatar', href: '/avatar' },
  { name: 'Badge', href: '/badge' },
  { name: 'Button', href: '/button' },
  { name: 'Checkbox', href: '/checkbox' },
  { name: 'Combobox', href: '/combobox' },
  { name: 'Description List', href: '/description-list' },
  { name: 'Dialog', href: '/dialog' },
  { name: 'Divider', href: '/divider' },
  { name: 'Dropdown', href: '/dropdown' },
  { name: 'Fieldset', href: '/fieldset' },
  { name: 'Heading', href: '/heading' },
  { name: 'Input', href: '/input' },
  { name: 'Link', href: '/link' },
  { name: 'Listbox', href: '/listbox' },
  { name: 'Navbar', href: '/navbar' },
  { name: 'Pagination', href: '/pagination' },
  { name: 'Radio', href: '/radio' },
  { name: 'Select', href: '/select' },
  { name: 'Sidebar', href: '/sidebar' },
  { name: 'Switch', href: '/switch' },
  { name: 'Table', href: '/table' },
  { name: 'Text', href: '/text' },
  { name: 'Textarea', href: '/textarea' },
];

export const DemoLayout = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <ThemeSwitcher />
    <SidebarLayout
      navbar={<Navbar />}
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <SidebarSection className="max-lg:hidden">
              {layouts.map(({ name, href }) => (
                <SidebarItem key={name} href={href}>
                  {name}
                </SidebarItem>
              ))}
            </SidebarSection>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection className="">
              {components.map(({ name, href }) => (
                <SidebarItem key={name} href={href}>
                  {name}
                </SidebarItem>
              ))}
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  </ThemeProvider>
);
