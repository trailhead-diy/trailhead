import type { ReactNode } from 'react'
import clsx from 'clsx'
import Heading from '@theme/Heading'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  icon: string
  description: ReactNode
  link: string
}

const FeatureList: FeatureItem[] = [
  {
    title: 'CLI Framework',
    icon: '🚀',
    description: (
      <>
        A functional CLI framework for building robust, testable command-line applications with
        TypeScript. Features Result-based error handling, modular architecture, and comprehensive
        testing utilities.
      </>
    ),
    link: '/packages/cli',
  },
  {
    title: 'Create CLI',
    icon: '🏗️',
    description: (
      <>
        Quick-start your CLI projects with our project generator. Includes templates, best
        practices, and everything you need to build production-ready command-line tools.
      </>
    ),
    link: '/packages/create-cli',
  },
  {
    title: 'Functional Utilities',
    icon: '🧩',
    description: (
      <>
        Core utilities following functional programming patterns. Includes Result types, file system
        abstractions, data processing, validation, and configuration management.
      </>
    ),
    link: '/docs/explanation/functional-architecture',
  },
]

const PackageList = [
  {
    name: '@esteban-url/core',
    description: 'Core Result types and utilities',
    link: '/packages/core',
  },
  {
    name: '@esteban-url/config',
    description: 'Type-safe configuration management',
    link: '/packages/config',
  },
  {
    name: '@esteban-url/fs',
    description: 'Functional file system operations',
    link: '/packages/fs',
  },
  {
    name: '@esteban-url/data',
    description: 'Data processing and transformations',
    link: '/packages/data',
  },
  {
    name: '@esteban-url/validation',
    description: 'Schema validation and type guards',
    link: '/packages/validation',
  },
]

function Feature({ title, icon, description, link }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <div className={styles.featureIcon}>{icon}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <Link className="button button--sm button--secondary" to={link}>
          Learn More →
        </Link>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): ReactNode {
  return (
    <>
      <section className={styles.features}>
        <div className="container">
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>

      <section className={clsx(styles.packages, 'padding-vert--lg')}>
        <div className="container">
          <Heading as="h2" className="text--center margin-bottom--lg">
            Package Ecosystem
          </Heading>
          <div className="row">
            {PackageList.map((pkg, idx) => (
              <div key={idx} className="col col--4 margin-bottom--md">
                <div className={clsx('card', 'padding--md')}>
                  <h4>
                    <Link to={pkg.link}>{pkg.name}</Link>
                  </h4>
                  <p>{pkg.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
