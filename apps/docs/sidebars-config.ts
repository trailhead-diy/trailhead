import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  configSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: ['docs/reference/api'],
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/packages/config/api',
    },
  ],
}

export default sidebars
