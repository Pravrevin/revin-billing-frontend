import { useEffect, useMemo, useState } from 'react'
import { MENUS } from '../../data/menus'
import type { PermissionItem } from '../../services/authApi'
import { getUserPermissions, setUserPermissions } from '../../services/adminApi'
import styles from './admin.module.css'

type Props = {
  userId: number
  username: string
  onClose: () => void
  onSaved?: () => void
}

/** Encodes granted subs as a Set of "menuId:subId". A whole-menu grant is
 *  represented by selecting every sub of that menu. */
function keysFromPermissions(perms: PermissionItem[]): Set<string> {
  const set = new Set<string>()
  for (const p of perms) {
    if (p.sub_id === null || p.sub_id === undefined) {
      const menu = MENUS.find((m) => m.id === p.menu_id)
      menu?.subs.forEach((s) => set.add(`${p.menu_id}:${s.id}`))
    } else {
      set.add(`${p.menu_id}:${p.sub_id}`)
    }
  }
  return set
}

export function PermissionsEditor({ userId, username, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getUserPermissions(userId)
      .then((perms) => setSelected(keysFromPermissions(perms)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleMenu = (menuId: number, on: boolean) => {
    const menu = MENUS.find((m) => m.id === menuId)
    if (!menu) return
    setSelected((prev) => {
      const next = new Set(prev)
      menu.subs.forEach((s) => {
        const k = `${menuId}:${s.id}`
        if (on) next.add(k)
        else next.delete(k)
      })
      return next
    })
  }

  const menuState = useMemo(() => {
    const map: Record<number, { all: boolean; some: boolean }> = {}
    for (const m of MENUS) {
      const total = m.subs.length
      const on = m.subs.filter((s) => selected.has(`${m.id}:${s.id}`)).length
      map[m.id] = { all: total > 0 && on === total, some: on > 0 && on < total }
    }
    return map
  }, [selected])

  const onSave = async () => {
    setSaving(true)
    setError('')
    try {
      // Collapse fully-selected menus into a single whole-menu grant.
      const perms: PermissionItem[] = []
      for (const m of MENUS) {
        const st = menuState[m.id]
        if (st?.all) {
          perms.push({ menu_id: m.id, sub_id: null })
        } else {
          m.subs.forEach((s) => {
            if (selected.has(`${m.id}:${s.id}`)) perms.push({ menu_id: m.id, sub_id: s.id })
          })
        }
      }
      await setUserPermissions(userId, perms)
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save permissions.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Menu access — {username}</h3>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading permissions…</p>
        ) : (
          <>
            <p className={styles.muted}>
              Tick the menus and sub-menus this user may see. Unticked items are hidden
              from their sidebar.
            </p>
            <div style={{ maxHeight: '55vh', overflow: 'auto', marginTop: '0.75rem' }}>
              {MENUS.map((menu) => {
                const st = menuState[menu.id]
                return (
                  <div key={menu.id} className={styles.permMenu}>
                    <label className={styles.permMenuHead}>
                      <input
                        type="checkbox"
                        checked={st?.all ?? false}
                        ref={(el) => {
                          if (el) el.indeterminate = st?.some ?? false
                        }}
                        onChange={(e) => toggleMenu(menu.id, e.target.checked)}
                      />
                      <span>{menu.icon} {menu.label}</span>
                    </label>
                    <div className={styles.permSubs}>
                      {menu.subs.map((sub) => (
                        <label key={sub.id} className={styles.permItem}>
                          <input
                            type="checkbox"
                            checked={selected.has(`${menu.id}:${sub.id}`)}
                            onChange={() => toggle(`${menu.id}:${sub.id}`)}
                          />
                          <span>{sub.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions} style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className={styles.btnGhost} onClick={onClose}>
                Cancel
              </button>
              <button className={styles.btn} onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save permissions'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
