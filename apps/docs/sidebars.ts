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
        'tutorials/config-getting-started',
        'tutorials/data-pipeline-processing',
        'tutorials/file-operations-basics',
        'tutorials/form-validation-guide',
      ],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      collapsed: true,
      items: [
        'how-to/contributing',
        'how-to/apply-functional-patterns',
        'how-to/compose-result-operations',
        'how-to/convert-data-formats',
        'how-to/create-custom-validators',
        'how-to/define-schemas',
        'how-to/generate-config-docs',
        'how-to/maintain-cross-references',
        'how-to/perform-atomic-file-operations',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: [
        'reference/documentation-standards',
        'reference/writing-guide',
        'reference/core-api',
        'reference/cross-reference-style-guide',
        'reference/configuration-patterns',
        'reference/review-checklist',
        {
          type: 'category',
          label: 'Templates',
          items: [
            'reference/templates/tutorial-template',
            'reference/templates/howto-template',
            'reference/templates/reference-template',
            'reference/templates/explanation-template',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Explanations',
      collapsed: true,
      items: [
        'explanation/functional-architecture',
        'explanation/result-types-pattern',
        'explanation/config-sources',
        'explanation/package-ecosystem',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      collapsed: true,
      items: [
        'DEVELOPMENT_WORKFLOW',
        'RELEASE_PROCESS',
        'ci-strategy',
        'git-commit-best-practices',
        'testing-guide',
        'PACKAGE_REGISTRY',
      ],
    },
  ],
}

export default sidebars
