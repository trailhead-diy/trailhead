import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  cliSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: false,
      items: ['tutorials/getting-started', 'tutorials/csv-hell', 'tutorials/build-complete-cli'],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      collapsed: true,
      items: [
        'how-to/handle-errors-in-cli',
        'how-to/test-cli-applications',
        'how-to/migrate-to-command-enhancements',
        'how-to/use-result-pipelines',
        'how-to/migrate-to-pipelines',
        'how-to/optimization-guide',
        'how-to/import-patterns',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: [
        'reference/core',
        'reference/command',
        'reference/command-enhancements',
        'reference/filesystem',
        'reference/config',
        'reference/prompts',
        'reference/testing',
        'reference/utils',
        'reference/types',
        'reference/flow-control',
        'reference/build-config',
      ],
    },
    {
      type: 'category',
      label: 'Explanations',
      collapsed: true,
      items: ['explanation/architecture', 'explanation/design-decisions'],
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/packages/cli/api',
    },
  ],
}

export default sidebars
