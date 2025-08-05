import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  fsSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'How-To Guides',
      collapsed: false,
      items: ['docs/how-to/file-operations'],
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
      items: ['docs/explanation/result-patterns'],
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/packages/fs/api',
    },
  ],
}

export default sidebars
