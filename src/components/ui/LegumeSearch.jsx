import { useState, useEffect, useRef } from 'react'

export default function LegumeSearch({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState(null)
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .includes(search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  )

  const selected = options.find(o => o.value === value)

  const handleFocus = () => {
    setSearch('')
    setOpen(true)
  }

  const handleSelect = (v) => {
    onChange(v)
    const sel = options.find(o => o.value === v)
    setSearch(sel ? sel.label : '')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={open ? search : (selected ? selected.label : '')}
          placeholder={placeholder || '-- Choisir --'}
          onFocus={handleFocus}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          style={{
            width: '100%', padding: '10px 30px 10px 12px', background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(109,191,109,0.3)', borderRadius: 10,
            color: '#e8f5e8', fontSize: 16, fontFamily: 'Amaranth, sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <span
          onClick={() => { setOpen(!open); if (!open) inputRef.current?.focus() }}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 10, color: '#6dbf6d', cursor: 'pointer',
          }}
        >{open ? '\u25B2' : '\u25BC'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
          background: '#1a2e1a', border: '1px solid rgba(109,191,109,0.25)',
          borderRadius: 10, marginTop: 4, maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '9px 12px', fontSize: 16, color: '#6dbf6d', fontFamily: 'Amaranth, sans-serif' }}>
              Aucun résultat
            </div>
          ) : filtered.map(o => (
            <div
              key={o.value}
              onMouseEnter={() => setHovered(o.value)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSelect(o.value)}
              style={{
                padding: '9px 12px', fontSize: 16, fontFamily: 'Amaranth, sans-serif',
                color: '#e8f5e8', cursor: 'pointer',
                background: hovered === o.value ? '#2d4a2d' : 'transparent',
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
