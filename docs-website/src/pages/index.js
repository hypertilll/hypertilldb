import Link from '@docusaurus/Link'
import Layout from '@theme/Layout'
import useBaseUrl from '@docusaurus/useBaseUrl'
import React from 'react'
import styles from './index.module.css'

const highlights = [
  {
    label: 'Expo Ready',
    title: 'Install from npm and wire native SQLite through the built-in Expo plugin.',
    text: 'Hypertill DB 0.0.1 ships as @hypertill/db and includes the Expo config plugin needed for Android JSI setup.',
  },
  {
    label: 'Reactive Reads',
    title: 'Keep records, relations, lists, and counts live without building your own observer layer.',
    text: 'The current React surface centers on DatabaseProvider, useDatabase, and withObservables for reactive screens.',
  },
  {
    label: 'Native Performance',
    title: 'Run against SQLite on iOS, Android, and Node, or LokiJS for web.',
    text: 'Queries stay in the database engine until you ask for results, which keeps large local datasets practical.',
  },
  {
    label: 'Reference App',
    title: 'Study a real TypeScript Expo app with books, chapters, and notes.',
    text: 'The external Expo book-reader demo shows how the package feels in an app with separate screens and real CRUD.',
  },
]

const workflow = [
  {
    step: '01',
    title: 'Install and build a native client',
    text: 'Start with npm, register the Expo plugin or use bare React Native autolinking, then run Android and iOS builds locally.',
  },
  {
    step: '02',
    title: 'Define schema and models',
    text: 'Create your tables, model classes, and adapter bootstrap in TypeScript so the database shape is explicit from day one.',
  },
  {
    step: '03',
    title: 'Connect React to live data',
    text: 'Wrap the app with DatabaseProvider, use withObservables for reactive reads, and useDatabase for writes and screen actions.',
  },
]

const references = [
  {
    title: 'Installation',
    text: 'The modern npm and Expo quickstart, including the current plugin and native build requirements.',
    to: '/docs/Installation',
  },
  {
    title: 'Setup',
    text: 'A TypeScript-first project layout for schema, models, database bootstrap, and app wiring.',
    to: '/docs/Setup',
  },
  {
    title: 'React Components',
    text: 'How the current React API works in 0.0.1, and where to use withObservables versus useDatabase.',
    to: '/docs/Components',
  },
  {
    title: 'Expo Demo',
    text: 'The book-reader example app repo that shows books, chapters, and notes using the published package.',
    href: 'https://github.com/hypertilll/expo-hypertillDB-example',
  },
]

export default function Home() {
  const logoUrl = useBaseUrl('/img/logo.svg')

  return (
    <Layout
      title="Hypertill DB"
      description="Reactive local-first database package for React, React Native, Expo, and web apps."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>Hypertill DB 0.0.1</div>
              <h1 className={styles.title}>A modern local-first database package for React and Expo teams.</h1>
              <p className={styles.description}>
                Hypertill DB gives you a published npm package, native SQLite performance, reactive reads, and a
                current Expo reference app that shows exactly how the package fits into a TypeScript mobile project.
              </p>
              <div className={styles.actions}>
                <Link className={styles.primaryAction} to="/docs/Installation">
                  Start Installation
                </Link>
                <Link className={styles.secondaryAction} href="https://github.com/hypertilll/expo-hypertillDB-example">
                  Open Expo Demo
                </Link>
              </div>
              <div className={styles.meta}>
                <span>Published to npm as `@hypertill/db`</span>
                <span>Expo SDK 54+ plugin included</span>
                <span>Android and iOS native builds supported</span>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <img className={styles.logo} src={logoUrl} alt="Hypertill DB logo" />
              <div className={styles.panelSection}>
                <div className={styles.panelTitle}>Current package reality</div>
                <ul className={styles.panelList}>
                  <li>Reactive reads today use `withObservables`.</li>
                  <li>Imperative writes and app glue use `useDatabase`.</li>
                  <li>The TypeScript Expo demo is the fastest working reference.</li>
                </ul>
              </div>
              <div className={styles.panelSection}>
                <div className={styles.panelTitle}>Good fit for</div>
                <ul className={styles.panelList}>
                  <li>Offline-first mobile apps</li>
                  <li>Structured local domain models</li>
                  <li>Apps that need explicit sync boundaries</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Highlights</div>
            <h2>What is already solid in 0.0.1</h2>
          </div>
          <div className={styles.cardGrid}>
            {highlights.map((item) => (
              <article key={item.title} className={styles.card}>
                <div className={styles.cardLabel}>{item.label}</div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Workflow</div>
            <h2>How teams should approach Hypertill DB today</h2>
          </div>
          <div className={styles.stepGrid}>
            {workflow.map((item) => (
              <article key={item.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{item.step}</div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Read Next</div>
            <h2>The docs you actually need first</h2>
          </div>
          <div className={styles.referenceGrid}>
            {references.map((item) => (
              <article key={item.title} className={styles.referenceCard}>
                <h3 className={styles.referenceTitle}>{item.title}</h3>
                <p className={styles.referenceText}>{item.text}</p>
                {'to' in item ? (
                  <Link className={styles.referenceLink} to={item.to}>
                    Open guide
                  </Link>
                ) : (
                  <Link className={styles.referenceLink} href={item.href}>
                    Open repo
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  )
}
