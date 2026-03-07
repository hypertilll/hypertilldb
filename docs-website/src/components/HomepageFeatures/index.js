import clsx from 'clsx'
import React from 'react'
import { Zap, Database, CloudOff } from 'lucide-react'
import styles from './styles.module.css'

const FeatureList = [
  {
    title: 'Lightning Fast',
    description: (
      <>
        Hypertill DB was designed from the ground up to be blazing fast and launch your app
        instantly no matter how much data you have.
      </>
    ),
    Icon: Zap,
    color: 'var(--ifm-color-primary)',
  },
  {
    title: 'Highly Scalable',
    description: (
      <>
        Built on rock-solid SQLite foundation and optimized to handle from hundreds
        to tens of thousands of records with ease.
      </>
    ),
    Icon: Database,
    color: 'var(--hypertill-purple)',
  },
  {
    title: 'Offline-First',
    description: (
      <>
        Ideal for offline-first apps, sync with your own server using the Hypertill DB sync
        engine.
      </>
    ),
    Icon: CloudOff,
    color: 'var(--hypertill-purple)',
  },
]

function Feature({ title, description, Icon, color }) {
  return (
    <div className={clsx('col col--4', styles.featureItem)}>
      <div className={styles.featureCard}>
        <div className={styles.iconWrapper} style={{ '--feature-color': color }}>
          <Icon className={styles.featureIcon} size={32} strokeWidth={1.5} />
        </div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Why Hypertill DB?</span>
          <h2 className={styles.sectionTitle}>Built for Modern Apps</h2>
        </div>
        <div className="row">
          {FeatureList.map((props) => (
            <Feature key={props.title} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
