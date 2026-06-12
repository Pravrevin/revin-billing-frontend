import { useRef, useState } from 'react'
import { extractBill } from '../../services/purchaseApi'
import type { ExtractedBill } from '../../types/purchase'
import styles from '../../pages/ProductMasterPage.module.css'

type Mode = 'pdf' | 'image' | 'images'

const MODES: { key: Mode; icon: string; title: string; hint: string; accept: string; multiple: boolean }[] = [
  { key: 'pdf',    icon: '📄',   title: 'PDF bill',        hint: 'A single PDF (any number of pages)', accept: 'application/pdf,.pdf', multiple: false },
  { key: 'image',  icon: '🖼️',   title: 'Single image',    hint: 'One photo / scan of the bill',       accept: 'image/*',              multiple: false },
  { key: 'images', icon: '🖼️🖼️', title: 'Multiple images', hint: 'Several photos (multi-page, up to 10)', accept: 'image/*',          multiple: true  },
]

/**
 * Lets the user upload a supplier bill in one of three ways (PDF / single image /
 * multiple images) and runs AI extraction. On success it hands the prefill payload
 * back to the parent purchase form via onExtracted.
 */
export function UploadBillDialog({
  onClose,
  onExtracted,
}: {
  onClose: () => void
  onExtracted: (result: ExtractedBill) => void
}) {
  const [mode, setMode] = useState<Mode>('pdf')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const activeMode = MODES.find((m) => m.key === mode)!

  function pickMode(m: Mode) {
    setMode(m)
    setFiles([])
    setErr(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function onFilesChosen(list: FileList | null) {
    const arr = list ? Array.from(list) : []
    if (mode === 'images' && arr.length > 10) {
      setErr('Please choose at most 10 images.')
      setFiles(arr.slice(0, 10))
      return
    }
    setErr(null)
    setFiles(arr)
  }

  async function handleExtract() {
    if (files.length === 0) {
      setErr('Choose a file to upload first.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const result = await extractBill(files)
      onExtracted(result)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Bill extraction failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-bill-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="upload-bill-title">🤖 Upload Bill with AI</h2>
            <p>Upload a supplier bill — AI reads it and fills the purchase entry for you.</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close" disabled={busy}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {err ? <div className={`${styles.banner} ${styles.bannerError}`}>{err}</div> : null}

          {/* ── Mode picker ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.7rem',
              marginBottom: '1.1rem',
            }}
          >
            {MODES.map((m) => {
              const active = m.key === mode
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => pickMode(m.key)}
                  disabled={busy}
                  style={{
                    textAlign: 'left',
                    padding: '0.8rem 0.9rem',
                    borderRadius: '11px',
                    border: active ? '2px solid var(--medical-deep, #0e7490)' : '1px solid var(--border)',
                    background: active ? '#ecfeff' : '#fff',
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>{m.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.4rem' }}>{m.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{m.hint}</div>
                </button>
              )
            })}
          </div>

          {/* ── File input ── */}
          <div className={styles.formField}>
            <label htmlFor="upload-bill-file">
              Select {activeMode.multiple ? 'images' : activeMode.key === 'pdf' ? 'PDF' : 'image'}
            </label>
            <input
              id="upload-bill-file"
              ref={fileRef}
              type="file"
              accept={activeMode.accept}
              multiple={activeMode.multiple}
              disabled={busy}
              onChange={(e) => onFilesChosen(e.target.files)}
            />
            {files.length > 0 ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--medical-deep, #0e7490)', marginTop: '0.3rem' }}>
                {files.length === 1 ? files[0].name : `${files.length} files selected`}
              </span>
            ) : null}
          </div>

          {busy ? (
            <div className={styles.banner} style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af', marginTop: '0.9rem' }}>
              ⏳ Reading the bill with AI… this can take 20–60 seconds for multi-page documents. Please wait.
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.9rem' }}>
              Tip: clearer scans give better results. After extraction you can review and correct every field before saving.
            </p>
          )}
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void handleExtract()}
            disabled={busy || files.length === 0}
          >
            {busy ? 'Extracting…' : '✨ Extract with AI'}
          </button>
        </div>
      </div>
    </div>
  )
}
