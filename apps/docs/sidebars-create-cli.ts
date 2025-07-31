import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  createCliSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: false,
      items: ['tutorials/getting-started'],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      collapsed: true,
      items: ['how-to/customize-templates', 'how-to/configure-defaults', 'how-to/custom-prompts'],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: ['reference/api', 'reference/templates', 'reference/schema'],
    },
    {
      type: 'category',
      label: 'Explanations',
      collapsed: true,
      items: ['explanation/templates'],
    },
  ],
}

export default sidebars
