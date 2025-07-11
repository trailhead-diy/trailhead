import { DemoLayout } from './demo-ui';
// Import all example components
import {
  AlertExamples,
  AuthLayoutExamples,
  AvatarExamples,
  BadgeExamples,
  ButtonExamples,
  CheckboxExamples,
  ComboboxExamples,
  DescriptionListExamples,
  DialogExamples,
  DividerExamples,
  DropdownExamples,
  FieldsetExamples,
  HeadingExamples,
  InputExamples,
  LinkExamples,
  ListboxExamples,
  NavbarExamples,
  PaginationExamples,
  RadioExamples,
  SelectExamples,
  SidebarExamples,
  SidebarLayoutExamples,
  StackedLayoutExamples,
  SwitchExamples,
  TableExamples,
  TextExamples,
  TextareaExamples,
} from './examples';

// Helper to create a page from an example component
const createPage = (ExampleComponent: React.ComponentType) => () => (
  <DemoLayout>
    <ExampleComponent />
  </DemoLayout>
);

/**
 * Component route configuration - Single source of truth for all demo components
 *
 * This object defines the mapping between URL routes, page names, and example components.
 * Adding a new component here automatically:
 * - Creates the route mapping for Next.js dynamic routes
 * - Generates the page component with DemoLayout wrapper
 * - Updates static generation for build optimization
 *
 * @example
 * To add a new component:
 * ```tsx
 * 'new-component': {
 * page: 'NewComponentPage',
 *  component: NewExamples },
 * ```
 *
 * This will:
 * 1. Create route `/new-component`
 * 2. Generate `NewComponentPage` in the pages object
 * 3. Render `<NewExamples />` wrapped in `<DemoLayout>`
 */
const componentConfig = {
  alert: {
    page: 'AlertPage',
    component: AlertExamples,
  },
  'auth-layout': {
    page: 'AuthLayoutPage',
    component: AuthLayoutExamples,
  },
  avatar: {
    page: 'AvatarPage',
    component: AvatarExamples,
  },
  badge: {
    page: 'BadgePage',
    component: BadgeExamples,
  },
  button: {
    page: 'ButtonPage',
    component: ButtonExamples,
  },
  checkbox: {
    page: 'CheckboxPage',
    component: CheckboxExamples,
  },
  combobox: {
    page: 'ComboboxPage',
    component: ComboboxExamples,
  },
  'description-list': {
    page: 'DescriptionListPage',
    component: DescriptionListExamples,
  },
  dialog: {
    page: 'DialogPage',
    component: DialogExamples,
  },
  divider: {
    page: 'DividerPage',
    component: DividerExamples,
  },
  dropdown: {
    page: 'DropdownPage',
    component: DropdownExamples,
  },
  fieldset: {
    page: 'FieldsetPage',
    component: FieldsetExamples,
  },
  heading: {
    page: 'HeadingPage',
    component: HeadingExamples,
  },
  input: {
    page: 'InputPage',
    component: InputExamples,
  },
  link: {
    page: 'LinkPage',
    component: LinkExamples,
  },
  listbox: {
    page: 'ListboxPage',
    component: ListboxExamples,
  },
  navbar: {
    page: 'NavbarPage',
    component: NavbarExamples,
  },
  pagination: {
    page: 'PaginationPage',
    component: PaginationExamples,
  },
  radio: {
    page: 'RadioPage',
    component: RadioExamples,
  },
  select: {
    page: 'SelectPage',
    component: SelectExamples,
  },
  sidebar: {
    page: 'SidebarPage',
    component: SidebarExamples,
  },
  'sidebar-layout': {
    page: 'SidebarLayoutPage',
    component: SidebarLayoutExamples,
  },
  'stacked-layout': {
    page: 'StackedLayoutPage',
    component: StackedLayoutExamples,
  },
  switch: {
    page: 'SwitchPage',
    component: SwitchExamples,
  },
  table: {
    page: 'TablePage',
    component: TableExamples,
  },
  text: {
    page: 'TextPage',
    component: TextExamples,
  },
  textarea: {
    page: 'TextareaPage',
    component: TextareaExamples,
  },
} as const;

// Auto-generate route to page mapping
export const routeToPageMap = Object.fromEntries(
  Object.entries(componentConfig).map(([route, { page }]) => [route, page])
);

// Auto-generate pages object
export const pages = Object.fromEntries(
  Object.entries(componentConfig).map(([, { page, component }]) => [page, createPage(component)])
);

export { DemoLayout } from './demo-ui';
export const HomePage = () => <DemoLayout>Hola!</DemoLayout>;
