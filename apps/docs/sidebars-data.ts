import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  dataSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'How-To Guides',
      collapsed: false,
      items: ['docs/how-to/process-data-files'],
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
      items: ['docs/explanation/format-detection'],
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/packages/data/api',
    },
  ],
}

export default sidebars
