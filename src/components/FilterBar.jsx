import { FiX } from 'react-icons/fi'

export default function FilterBar({ filters, setFilters, semesters, courses, categories, tags }) {
  const handle = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
  const hasFilters = Object.values(filters).some(v => v)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {semesters && (
          <select value={filters.semester || ''} onChange={e => handle('semester', e.target.value)}
            style={{ height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Semua Semester</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {courses && (
          <select value={filters.course || ''} onChange={e => handle('course', e.target.value)}
            style={{ height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Semua Matkul</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {categories && (
          <select value={filters.category || ''} onChange={e => handle('category', e.target.value)}
            style={{ height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {tags && tags.length > 0 && (
          <select value={filters.tag || ''} onChange={e => handle('tag', e.target.value)}
            style={{ height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Semua Tag</option>
            {tags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {hasFilters && (
          <button onClick={() => setFilters({})}
            style={{ height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <FiX size={13} /> Reset filter
          </button>
        )}
      </div>
      {hasFilters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
            <span key={k}
              onClick={() => handle(k, '')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', backgroundColor: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
              {v}
              <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
