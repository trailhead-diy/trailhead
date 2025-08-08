import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: false,
      items: [
        'tutorials/csv-hell-to-cli-heaven',
      ],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      collapsed: false,
      items: [
        'how-to/common-workflows',
        'how-to/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'reference/api/index',
        'reference/api/cli-building',
        'reference/api/file-operations',
      ],
    },
    {
      type: 'category',
      label: 'Explanation',
      collapsed: true,
      items: [
        'explanation/architecture',
      ],
    },
  ],
}

export default sidebars