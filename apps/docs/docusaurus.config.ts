import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'Trailhead Documentation',
  tagline: 'Modern toolkit for building UI libraries and CLIs',
  favicon: 'img/favicon.ico',

  // Future flags
  future: {
    v4: true,
  },

  // Production URL configuration
  url: 'https://docs.trailhead.dev',
  baseUrl: '/',

  // GitHub deployment config
  organizationName: 'esteban-url',
  projectName: 'trailhead-docs',
  trailingSlash: false,

  // Error handling
  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',
  onDuplicateRoutes: 'throw',

  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Main docs preset
  presets: [
    [
      'classic',
      {
        docs: {
          // Main documentation from monorepo docs folder
          path: '../../docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // Multiple docs instances for packages
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'cli',
        path: '../../packages/cli/docs',
        routeBasePath: 'packages/cli',
        sidebarPath: './sidebars-cli.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'create-cli',
        path: '../../packages/create-cli/docs',
        routeBasePath: 'packages/create-cli',
        sidebarPath: './sidebars-create-cli.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'core',
        path: '../../packages/core',
        routeBasePath: 'packages/core',
        sidebarPath: './sidebars-core.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
        include: ['README.md'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'config',
        path: '../../packages/config',
        routeBasePath: 'packages/config',
        sidebarPath: './sidebars-config.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
        include: ['README.md', 'docs/**/*.{md,mdx}'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'data',
        path: '../../packages/data',
        routeBasePath: 'packages/data',
        sidebarPath: './sidebars-data.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
        include: ['README.md', 'docs/**/*.{md,mdx}'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'fs',
        path: '../../packages/fs',
        routeBasePath: 'packages/fs',
        sidebarPath: './sidebars-fs.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
        include: ['README.md', 'docs/**/*.{md,mdx}'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'validation',
        path: '../../packages/validation',
        routeBasePath: 'packages/validation',
        sidebarPath: './sidebars-validation.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
        include: ['README.md', 'docs/**/*.{md,mdx}'],
      },
    ],
  ],

  themeConfig: {
    // SEO
    image: 'img/trailhead-social-card.jpg',
    metadata: [
      { name: 'keywords', content: 'trailhead, cli, framework, typescript, functional' },
      {
        name: 'description',
        content: 'Modern toolkit for building UI libraries and CLIs with TypeScript',
      },
    ],

    // Navbar configuration
    navbar: {
      title: 'Trailhead',
      logo: {
        alt: 'Trailhead Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'dropdown',
          label: 'Documentation',
          position: 'left',
          items: [
            {
              type: 'doc',
              docId: 'README',
              label: 'Overview',
            },
            {
              type: 'doc',
              docId: 'tutorials/config-getting-started',
              label: 'Tutorials',
            },
            {
              type: 'doc',
              docId: 'how-to/contributing',
              label: 'How-To Guides',
            },
            {
              type: 'doc',
              docId: 'reference/documentation-standards',
              label: 'Reference',
            },
            {
              type: 'doc',
              docId: 'explanation/functional-architecture',
              label: 'Explanations',
            },
          ],
        },
        {
          type: 'dropdown',
          label: 'Packages',
          position: 'left',
          items: [
            {
              to: '/packages/cli',
              label: 'CLI Framework',
            },
            {
              to: '/packages/create-cli',
              label: 'Create CLI',
            },
            {
              to: '/packages/core',
              label: 'Core',
            },
            {
              to: '/packages/config',
              label: 'Config',
            },
            {
              to: '/packages/data',
              label: 'Data',
            },
            {
              to: '/packages/fs',
              label: 'File System',
            },
            {
              to: '/packages/validation',
              label: 'Validation',
            },
          ],
        },
        {
          href: 'https://github.com/esteban-url/trailhead',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    // Footer configuration
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/tutorials/config-getting-started',
            },
            {
              label: 'API Reference',
              to: '/docs/reference/core-api',
            },
            {
              label: 'Contributing',
              to: '/docs/how-to/contributing',
            },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: 'CLI Framework',
              to: '/packages/cli',
            },
            {
              label: 'Create CLI',
              to: '/packages/create-cli',
            },
            {
              label: 'Core Utilities',
              to: '/packages/core',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/esteban-url/trailhead',
            },
            {
              label: 'NPM',
              href: 'https://www.npmjs.com/org/esteban-url',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Trailhead. Built with Docusaurus.`,
    },

    // Code highlighting
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'javascript'],
    },

    // Table of contents
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },

    // Algolia search configuration (placeholder - update with actual credentials)
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'trailhead',
      contextualSearch: true,
      searchPagePath: 'search',
    },
  } satisfies Preset.ThemeConfig,
}

export default config
