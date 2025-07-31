import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  validationSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'How-To Guides',
      collapsed: false,
      items: ['docs/how-to/validate-data'],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: ['docs/reference/api'],
    },
    {
      type: 'category',
      label: 'Explanations',
      collapsed: true,
      items: ['docs/explanation/composition-patterns'],
    },
  ],
}

export default sidebars
