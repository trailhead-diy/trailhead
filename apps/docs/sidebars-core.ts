import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  coreSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/packages/core/api',
    },
  ],
}

export default sidebars
