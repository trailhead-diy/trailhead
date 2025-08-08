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
          routeBasePath: '/',
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

  // No additional plugins - all docs are unified now
  plugins: [],

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
          type: 'doc',
          docId: 'README',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'doc',
          docId: 'tutorials/csv-hell-to-cli-heaven',
          position: 'left',
          label: 'Tutorial',
        },
        {
          type: 'doc',
          docId: 'reference/api/README',
          position: 'left',
          label: 'API Reference',
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
              to: '/tutorials/csv-hell-to-cli-heaven',
            },
            {
              label: 'API Reference',
              to: '/reference/api/',
            },
            {
              label: 'Architecture',
              to: '/explanation/architecture',
            },
          ],
        },
        {
          title: 'Community',
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
