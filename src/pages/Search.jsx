import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiX, FiFileText, FiEdit3, FiBookOpen, FiBook } from 'react-icons/fi'
import { api } from '../utils/api'

const TYPE_META = {
  material:   { label: 'Materi',  color: 'var(--accent)'   },
  assignment: { label: 'Tugas',   color: 'var(--warning)'  },
  note:       { label: 'Catatan', color: 'var(--success)'  },
  literature: { label: 'Literasi',color: 'var(--purple)'   },
}

function ResultCard({ item }) {
  const meta = TYPE_META[item._type] || { label: item._type, color: 'var(--text-muted)' }
  const link = item.drive_view_url || item.source_url
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = meta.color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {meta.label}
        </span>
      </div>
      <h3 style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', marginBottom: (item.description || item.content || item.summary) ? 6 : 0 }}>
        {item.title}
      </h3>
      {(item.description || item.content || item.summary) && (
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description || item.content || item.summary}
        </p>
      )}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
          Buka <FiBookOpen size={11} />
        </a>
      )}
    </div>
  )
}

export default function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); setSearched(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.search(q)
        setResults(res.data || [])
        setSearched(true)
      } catch (e) {
        console.error('Search error:', e.message)
        setResults([])
        setSearched(true)
      }
      setLoading(false)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [q])

  const grouped = results.reduce((acc, r) => {
    const key = r._type
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Pencarian</h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-secondary)' }}>Cari materi, tugas, catatan, dan literasi sekaligus.</p>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <FiSearch size={17} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Ketik untuk mencari..."
          style={{ width: '100%', padding: '13px 16px 13px 44px', borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><FiX size={16} /></button>}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Tidak ada hasil untuk "{q}"</p>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Coba kata kunci lain.</p>
        </div>
      )}

      {/* Results grouped by type */}
      {!loading && Object.entries(grouped).map(([type, items]) => {
        const meta = TYPE_META[type] || { label: type, color: 'var(--text-muted)' }
        return (
          <div key={type}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 4, height: 20, borderRadius: 99, backgroundColor: meta.color }} />
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.label}</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 99 }}>{items.length}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map(item => <ResultCard key={item.id} item={item} />)}
            </div>
          </div>
        )
      })}

      {/* Empty state (before search) */}
      {!q && !searched && (
        <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🔍</p>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Mulai mengetik untuk mencari</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cari di semua materi, tugas, catatan, dan referensi sekaligus.</p>
        </div>
      )}
    </div>
  )
}
