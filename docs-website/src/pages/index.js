import Link from '@docusaurus/Link'
import Layout from '@theme/Layout'
import React from 'react'
import styles from './index.module.css'

const features = [
  {
    label: 'Native SQLite',
    title: 'Keep data in the engine until you actually need it.',
    text: 'Hypertill DB is built for local-first apps that should stay fast as the dataset grows.',
  },
  {
    label: 'Expo Workflow',
    title: 'Install from npm and wire native setup through the packaged Expo plugin.',
    text: 'The current package story is designed around Android and iOS native builds, not manual local patching.',
  },
  {
    label: 'Reactive UI',
    title: 'Use the current React surface without inventing your own database runtime.',
    text: 'DatabaseProvider, useDatabase, and auto-generated hooks are the supported building blocks in 0.0.3.',
  },
]

const gettingStarted = [
  {
    title: 'Install',
    text: 'Use the published package, register the Expo plugin, and build a native client.',
    to: '/docs/Installation',
  },
  {
    title: 'Set Up',
    text: 'Create schema, models, and database bootstrap in a dedicated TypeScript db folder.',
    to: '/docs/Setup',
  },
  {
    title: 'Connect React',
    text: 'Wire live reads with hooks and use useDatabase for writes and app actions.',
    to: '/docs/Components',
  },
  {
    title: 'Open Demo',
    text: 'Study the book reader Expo app that shows books, chapters, and notes with the real package.',
    href: 'https://github.com/hypertilll/expo-hypertillDB-example',
  },
]

export default function Home() {
  return (
    <Layout
      title="Hypertill DB"
      description="Reactive local-first database package for React, React Native, Expo, and web apps."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroFrame}>
            <div className={styles.heroMain}>
              <div className={styles.eyebrow}>Published on npm as @hypertill/db</div>
              <h1 className={styles.title}>Reactive local-first data for Expo and React Native.</h1>
              <p className={styles.description}>
                Hypertill DB gives teams a real npm package, native SQLite performance, reactive reads, and a working
                TypeScript Expo reference app instead of a private local fork workflow.
              </p>

              <div className={styles.actions}>
                <Link className={styles.primaryAction} to="/docs/Installation">
                  Start Installation
                </Link>
                <Link className={styles.secondaryAction} href="https://github.com/hypertilll/expo-hypertillDB-example">
                  View Expo Demo
                </Link>
              </div>

              <div className={styles.metaRow}>
                <span>Version 0.0.3</span>
                <span>Expo SDK 54+ plugin included</span>
                <span>Android and iOS native builds</span>
              </div>
            </div>

            <aside className={styles.heroRail}>
              <div className={styles.railCard}>
                <div className={styles.railLabel}>Install path</div>
                <pre className={styles.codeBlock}>
                  <code>{`npm install @hypertill/db expo-dev-client
npx expo run:android
npx expo run:ios`}</code>
                </pre>
              </div>

              <div className={styles.railCard}>
                <div className={styles.railLabel}>Current package reality</div>
                <ul className={styles.list}>
                  <li>Reactive reads use hooks (auto-generated per model).</li>
                  <li>Writes and imperative access use useDatabase.</li>
                  <li>The TypeScript Expo demo is the fastest reference.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Why It Works</div>
            <h2>Designed like a product site, not a patched library mirror.</h2>
          </div>

          <div className={styles.featureGrid}>
            {features.map((item) => (
              <article key={item.title} className={styles.featureCard}>
                <div className={styles.featureLabel}>{item.label}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>Read These First</div>
            <h2>The shortest path from install to a working app.</h2>
          </div>

          <div className={styles.startGrid}>
            {gettingStarted.map((item) => (
              <article key={item.title} className={styles.startCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {'to' in item ? (
                  <Link className={styles.inlineLink} to={item.to}>
                    Open guide
                  </Link>
                ) : (
                  <Link className={styles.inlineLink} href={item.href}>
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
