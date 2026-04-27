import type { ReactNode } from 'react'
import styles from './PageShell.module.css'

type Props = {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function PageShell({ title, subtitle, children }: Props) {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.sub}>{subtitle}</p> : null}
      </header>
      {children ?? (
        <div className={styles.placeholder}>
          <p>This module is ready for your data tables and forms.</p>
        </div>
      )}
    </div>
  )
}
