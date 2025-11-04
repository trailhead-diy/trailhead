import React from 'react'
import ComponentCreator from '@docusaurus/ComponentCreator'

export default [
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true,
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '5de'),
    exact: true,
  },
  {
    path: '/',
    component: ComponentCreator('/', '13a'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '30a'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '20d'),
            routes: [
              {
                path: '/explanation/architecture',
                component: ComponentCreator('/explanation/architecture', 'e91'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/how-to/common-workflows',
                component: ComponentCreator('/how-to/common-workflows', '68e'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/how-to/generate-api-docs',
                component: ComponentCreator('/how-to/generate-api-docs', '415'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/how-to/troubleshooting',
                component: ComponentCreator('/how-to/troubleshooting', 'b8b'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api',
                component: ComponentCreator('/reference/api', 'eff'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/cli',
                component: ComponentCreator('/reference/api/cli', '4b9'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/config',
                component: ComponentCreator('/reference/api/config', 'bd6'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/core',
                component: ComponentCreator('/reference/api/core', '310'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/create-cli',
                component: ComponentCreator('/reference/api/create-cli', 'a13'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/data',
                component: ComponentCreator('/reference/api/data', 'b86'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/fs',
                component: ComponentCreator('/reference/api/fs', '0d9'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/sort',
                component: ComponentCreator('/reference/api/sort', '016'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/reference/api/validation',
                component: ComponentCreator('/reference/api/validation', 'bbd'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/tutorials/csv-hell-to-cli-heaven',
                component: ComponentCreator('/tutorials/csv-hell-to-cli-heaven', '1be'),
                exact: true,
                sidebar: 'docsSidebar',
              },
              {
                path: '/',
                component: ComponentCreator('/', 'bf2'),
                exact: true,
                sidebar: 'docsSidebar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
]
