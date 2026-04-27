import { useEffect, useRef, useState } from 'react'
import selectStyles from './SearchableSelect.module.css'

type Props = {
  id?: string
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SearchableSelect({ id, options, value, onChange, placeholder = 'Select…', disabled }: Props) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const containerRef          = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  function select(opt: string) {
    onChange(opt)
    setQuery('')
    setOpen(false)
  }

  function clear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    if (!open) setOpen(true)
  }

  function handleFocus() {
    setOpen(true)
  }

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Keyboard: Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const displayValue = open ? query : value

  return (
    <div ref={containerRef} className={selectStyles.wrap}>
      <div className={`${selectStyles.control} ${disabled ? selectStyles.disabled : ''} ${open ? selectStyles.open : ''}`}>
        <input
          ref={inputRef}
          id={id}
          className={selectStyles.input}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={value ? value : placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {value && !open && (
          <button
            type="button"
            className={selectStyles.clearBtn}
            onClick={clear}
            tabIndex={-1}
            aria-label="Clear"
          >
            ×
          </button>
        )}
        <span className={`${selectStyles.arrow} ${open ? selectStyles.arrowUp : ''}`}>▾</span>
      </div>

      {open && (
        <div className={selectStyles.dropdown}>
          {filtered.length === 0 ? (
            <div className={selectStyles.empty}>No results found</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${selectStyles.option} ${opt === value ? selectStyles.selected : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(opt)
                }}
              >
                {opt}
                {opt === value && <span className={selectStyles.tick}>✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
