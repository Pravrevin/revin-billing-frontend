import { useEffect, useRef, useState } from 'react'
import { askAssistant, assistantStatus, reindexAssistant, type AssistantSource } from '../../services/assistantApi'
import styles from './AiAssistant.module.css'

type Msg = { role: 'user' | 'ai'; text: string; sources?: AssistantSource[] }

const SUGGESTIONS = [
  "What are today's total sales?",
  'How much do I owe suppliers?',
  'Which items are low on stock?',
  'What is my inventory value?',
  'Who are my top selling items?',
]

export function AiAssistant() {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('ai-open')
      if (saved != null) return saved === '1'
    } catch { /* ignore */ }
    // Default: open on desktop, collapsed on small screens.
    return typeof window !== 'undefined' && window.innerWidth > 900
  })
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [docs, setDocs] = useState<number | null>(null)
  const [reindexing, setReindexing] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!open) return
    void assistantStatus().then((s) => setDocs(s.documents)).catch(() => {})
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Persist preference and reserve page space when docked open (desktop).
  useEffect(() => {
    try { localStorage.setItem('ai-open', open ? '1' : '0') } catch { /* ignore */ }
    document.body.classList.toggle('ai-docked', open)
    return () => document.body.classList.remove('ai-docked')
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && open) setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function send(q: string) {
    const question = q.trim()
    if (!question || loading) return
    setErr(null)
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res = await askAssistant(question)
      setMessages((m) => [...m, { role: 'ai', text: res.answer, sources: res.sources }])
      if (!res.indexed) setDocs(0)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to get an answer')
    } finally {
      setLoading(false)
    }
  }

  async function reindex() {
    setReindexing(true)
    setErr(null)
    try {
      const r = await reindexAssistant()
      setDocs(r.documents)
      setMessages((m) => [...m, { role: 'ai', text: `🔄 Re-indexed your latest data — ${r.documents} records are now searchable.` }])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Reindex failed')
    } finally {
      setReindexing(false)
    }
  }

  return (
    <>
      {!open && (
        <button type="button" className={styles.fab} onClick={() => setOpen(true)} aria-label="Ask AI assistant">
          <span className={styles.fabIcon}>✨</span>
          Ask AI
          <span className={styles.fabPulse} aria-hidden />
        </button>
      )}

      {open && (
        <>
          <button type="button" className={styles.backdrop} aria-label="Close assistant" onClick={() => setOpen(false)} />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="AI assistant">
            <header className={styles.header}>
              <span className={styles.headerIcon}>✨</span>
              <div className={styles.headerTitle}>
                <h3>Ask AI</h3>
                <p>Answers from your live sales, stock &amp; accounts data</p>
              </div>
              <button type="button" className={styles.iconBtn} title="Re-index latest data" onClick={() => void reindex()} disabled={reindexing}>
                {reindexing ? '…' : '⟳'}
              </button>
              <button type="button" className={styles.iconBtn} aria-label="Close" onClick={() => setOpen(false)}>×</button>
            </header>

            <div className={styles.messages} ref={scrollRef}>
              {messages.length === 0 && (
                <div className={styles.welcome}>
                  <h4>👋 Hi! I'm your data assistant.</h4>
                  <p>Ask me anything about your sales, purchases, inventory, suppliers, customers, payments or expenses. I answer from your real database figures.</p>
                  <div className={styles.suggest}>
                    {SUGGESTIONS.map((s) => (
                      <button key={s} type="button" className={styles.chip} onClick={() => void send(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`${styles.row} ${m.role === 'user' ? styles.rowUser : styles.rowAi}`}>
                  <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                    {m.text}
                    {m.sources && m.sources.length > 0 && (
                      <details className={styles.sources}>
                        <summary>Data used ({m.sources.length})</summary>
                        {m.sources.map((s, j) => (
                          <div key={j} className={styles.sourceItem}>
                            <span className={styles.sourceKind}>{s.kind}</span>{s.text}
                          </div>
                        ))}
                      </details>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className={`${styles.row} ${styles.rowAi}`}>
                  <div className={`${styles.bubble} ${styles.bubbleAi}`}>
                    <span className={styles.typing}><span /><span /><span /></span>
                  </div>
                </div>
              )}
            </div>

            {err && <div className={styles.errLine}>{err}</div>}
            {docs != null && <div className={styles.statusBar}>{docs} records indexed · powered by Llama 3.1 (Groq)</div>}

            <div className={styles.inputBar}>
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder="Ask about sales, stock, dues…"
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) } }}
              />
              <button type="button" className={styles.sendBtn} onClick={() => void send(input)} disabled={loading || !input.trim()} aria-label="Send">
                ➤
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
