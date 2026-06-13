import { useEffect } from 'react'
import { SHORTCUTS, SHORTCUT_GROUPS } from '../../data/shortcuts'
import styles from './ShortcutsHelp.module.css'

const GLOBAL = [
  { keyLabel: 'F1', label: 'Open / close this help' },
  { keyLabel: 'Esc', label: 'Close popup / go back' },
]

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <span className={styles.headIcon} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6" />
            </svg>
          </span>
          <div className={styles.headText}>
            <h2>Keyboard Shortcuts</h2>
            <p>Marg-style quick keys for faster billing</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className={styles.body}>
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group} className={styles.group}>
              <h3 className={styles.groupTitle}>{group}</h3>
              <ul className={styles.list}>
                {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                  <li key={s.keyLabel} className={styles.item}>
                    <span className={styles.itemLabel}>{s.label}</span>
                    <kbd className={styles.kbd}>{s.keyLabel}</kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className={styles.group}>
            <h3 className={styles.groupTitle}>General</h3>
            <ul className={styles.list}>
              {GLOBAL.map((s) => (
                <li key={s.keyLabel} className={styles.item}>
                  <span className={styles.itemLabel}>{s.label}</span>
                  <kbd className={styles.kbd}>{s.keyLabel}</kbd>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className={styles.foot}>
          Press <kbd className={styles.kbd}>F1</kbd> any time to toggle this list.
        </footer>
      </div>
    </div>
  )
}
