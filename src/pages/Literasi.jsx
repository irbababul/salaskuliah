import { useState, useMemo } from 'react'
import { FiExternalLink, FiSearch, FiX, FiFileText, FiBook, FiBookOpen } from 'react-icons/fi'
import { AdminAddButton, AdminActions, AdminDeleteModal } from '../components/AdminToolbar'
import { useAuth } from '../contexts/AuthContext'
import { useApi } from '../hooks/useApi'
import { adminApi, api } from '../utils/api'

const TYPE_TABS = [
  { key: 'all',     label: 'Semua',  icon: FiBookOpen, color: 'var(--accent)' },
  { key: 'journal', label: 'Jurnal', icon: FiFileText, color: 'var(--accent)' },
  { key: 'book',    label: 'Buku',   icon: FiBook,     color: 'var(--warning)' },
  { key: 'article', label: 'Artikel',icon: FiBookOpen, color: 'var(--success)' },
]

/* ─── Form Modal ─────────────────────────────────────────────── */
function LitModal({ data, onSubmit, onClose, loading }) {
  const [form, setForm] = useState({
    title: data?.title || '', author: data?.author || '', year: data?.year || '',
    type: data?.type || 'article', topic: data?.topic || '', summary: data?.summary || '',
    source_url: data?.source_url || '', tags: data?.tags || '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 520, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{data ? 'Edit Referensi' : 'Tambah Referensi'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { k: 'title', label: 'Judul *', placeholder: 'Judul buku/jurnal' },
            { k: 'author', label: 'Penulis', placeholder: 'Nama penulis' },
            { k: 'year', label: 'Tahun', placeholder: '2024' },
          ].map(({ k, label, placeholder }) => (
            <div key={k}>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>{label}</label>
              <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Tipe</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none' }}>
              <option value="article">Artikel</option>
              <option value="book">Buku</option>
              <option value="journal">Jurnal</option>
              <option value="thesis">Skripsi/Tesis</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          {[
            { k: 'topic', label: 'Topik', placeholder: 'Matematika, Algoritma...' },
            { k: 'source_url', label: 'URL Sumber', placeholder: 'https://...' },
            { k: 'tags', label: 'Tags (pisah koma)', placeholder: 'wajib, referensi' },
          ].map(({ k, label, placeholder }) => (
            <div key={k}>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>{label}</label>
              <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Abstrak/Ringkasan</label>
            <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={3} placeholder="Ringkasan singkat..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13.5 }}>Batal</button>
          <button onClick={() => onSubmit(form)} disabled={loading}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--purple)', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: 13.5, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Lit Card ────────────────────────────────────────────────── */
function LitCard({ item, isAdmin, onEdit, onDelete }) {
  const tags = item.tags ? item.tags.split(',').filter(Boolean) : []
  const hasUrl = item.drive_view_url || item.source_url
  const link = item.drive_view_url || item.source_url
  const typeEmoji = { book: '📗', journal: '📄', article: '📰', thesis: '🎓' }
  return (
    <div style={{ padding: '18px 20px', borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20, backgroundColor: 'var(--bg-hover)' }}>
          {typeEmoji[item.type] || '📋'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.title}</h3>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {isAdmin && <AdminActions small onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} isPublished={item.is_published === 'true'} onTogglePublish={async () => { await adminApi.updateLiterature(item.id, { is_published: item.is_published === 'true' ? 'false' : 'true' }); reload && reload(); }} />}
              {hasUrl && (
                <a href={link} target="_blank" rel="noopener noreferrer"
                  style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}>
                  <FiExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 10px', marginBottom: 8 }}>
            {item.author && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.author}</p>}
            {item.year && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.year}</span>}
            {item.topic && <span style={{ fontSize: 12, color: 'var(--accent)', padding: '1px 8px', borderRadius: 99, backgroundColor: 'var(--accent-dim)' }}>{item.topic}</span>}
          </div>
          {item.summary && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.summary}</p>}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {tags.map(t => <span key={t} style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 99, backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{t.trim()}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Literasi() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: literature, reload } = useApi(() => isAdmin ? adminApi.getLiterature() : api.getLiterature(), [isAdmin], [])
  const litList = (literature || []).filter(l => !l.deleted_at)

  const filtered = useMemo(() => {
    let r = litList
    if (activeTab !== 'all') r = r.filter(l => l.type === activeTab)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(l => l.title.toLowerCase().includes(q) || (l.author || '').toLowerCase().includes(q) || (l.topic || '').toLowerCase().includes(q))
    }
    return r
  }, [litList, activeTab, search])

  async function handleSubmit(form) {
    setSaving(true)
    try {
      if (modal.data?.id) await adminApi.updateLiterature(modal.data.id, form)
      else await adminApi.createLiterature(form)
      reload()
      setModal(null)
    } catch (e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try { await adminApi.deleteLiterature(deleteTarget.id); reload() } catch (e) { alert('Error: ' + e.message) }
    setDeleteTarget(null)
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Literasi Akademik</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-secondary)' }}>{filtered.length} referensi</p>
        </div>
        {isAdmin && <AdminAddButton label="Tambah Referensi" onClick={() => setModal({ type: 'lit' })} />}
      </div>

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TYPE_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: '1px solid', borderColor: activeTab === t.key ? t.color : 'var(--border)', backgroundColor: activeTab === t.key ? `color-mix(in srgb, ${t.color} 15%, transparent)` : 'var(--bg-card)', color: activeTab === t.key ? t.color : 'var(--text-secondary)', fontSize: 13.5, fontWeight: activeTab === t.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
            <t.icon size={14} /> {t.label}
            <span style={{ fontSize: 11, opacity: 0.7 }}>({activeTab === t.key ? filtered.length : litList.filter(l => t.key === 'all' ? true : l.type === t.key).length})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <FiSearch size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari judul, penulis, topik..."
          style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><FiX size={14} /></button>}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📚</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Belum ada literasi</p>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{isAdmin ? 'Klik "Tambah Referensi" untuk mulai.' : 'Referensi akan ditampilkan di sini.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(item => <LitCard key={item.id} item={item} isAdmin={isAdmin} onEdit={i => setModal({ type: 'lit', data: i })} onDelete={setDeleteTarget} />)}
        </div>
      )}

      {modal && <LitModal data={modal.data} onSubmit={handleSubmit} onClose={() => setModal(null)} loading={saving} />}
      <AdminDeleteModal open={!!deleteTarget} title="Hapus Referensi" description={deleteTarget ? `Hapus "${deleteTarget.title}"?` : ''} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
