import { useState, useMemo } from 'react'
import { FiEdit3, FiSearch, FiX, FiTag, FiFilter } from 'react-icons/fi'
import { AdminAddButton, AdminActions, AdminDeleteModal } from '../components/AdminToolbar'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../utils/helpers'
import { useApi } from '../hooks/useApi'
import { adminApi, api } from '../utils/api'

/* ─── Form Modal ─────────────────────────────────────────────── */
function NoteModal({ data, courses, semesters, onSubmit, onClose, loading }) {
  const [form, setForm] = useState({
    title: data?.title || '', content: data?.content || '',
    course_id: data?.course_id || '', semester_id: data?.semester_id || '',
    tags: data?.tags || '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px 40px', overflowY: 'auto' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 560, padding: 24, margin: '0 auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{data ? 'Edit Catatan' : 'Tambah Catatan'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Judul *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Judul catatan..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Semester</label>
            <select value={form.semester_id} onChange={e => set('semester_id', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none' }}>
              <option value="">-- Pilih Semester --</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Mata Kuliah</label>
            <select value={form.course_id} onChange={e => set('course_id', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none' }}>
              <option value="">-- Pilih Mata Kuliah --</option>
              {courses.filter(c => !form.semester_id || c.semester_id === form.semester_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Isi Catatan</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={5} placeholder="Tulis catatan di sini..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Tags (pisah koma)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="perkuliahan, penting"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13.5 }}>Batal</button>
          <button onClick={() => onSubmit(form)} disabled={loading}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--success)', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: 13.5, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Note Card ──────────────────────────────────────────────── */
function NoteCard({ note, isOpen, onToggle, isAdmin, onEdit, onDelete, onReload }) {
  const tags = note.tags ? note.tags.split(',').filter(Boolean) : []
  return (
    <div onClick={onToggle}
      style={{ padding: '18px 20px', borderRadius: 12, backgroundColor: 'var(--bg-card)', border: `1px solid ${isOpen ? 'var(--border-strong)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>{note.title}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 8px' }}>
            {note.courseName && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, backgroundColor: 'var(--accent-dim)' }}>{note.courseName}</span>}
            {note.semesterName && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{note.semesterName}</span>}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {formatDate(note.created_at)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {isAdmin && <AdminActions small onEdit={() => onEdit(note)} onDelete={() => onDelete(note)} isPublished={note.is_published === 'true'} onTogglePublish={async () => { await adminApi.updateNote(note.id, { is_published: note.is_published === 'true' ? 'false' : 'true' }); onReload && onReload(); }} />}
          <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{isOpen ? '▾' : '▸'}</span>
        </div>
      </div>
      {!isOpen && note.content && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {note.content}
        </p>
      )}
      {isOpen && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {note.content}
        </div>
      )}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 99, backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <FiTag size={9} /> {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Catatan() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [openItems, setOpenItems] = useState({})
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: notes, reload } = useApi(() => isAdmin ? adminApi.getNotes() : api.getNotes(), [isAdmin], [])
  const { data: courses } = useApi(() => isAdmin ? adminApi.getCourses() : api.getCourses(), [isAdmin], [])
  const { data: semesters } = useApi(() => isAdmin ? adminApi.getSemesters() : api.getSemesters(), [isAdmin], [])

  const noteList = (notes || []).filter(n => !n.deleted_at)
  const courseList = courses || []
  const semList = semesters || []

  const enriched = useMemo(() => noteList.map(n => {
    const course = courseList.find(c => c.id === n.course_id) || {}
    const sem = semList.find(s => s.id === n.semester_id || s.id === course.semester_id) || {}
    return { ...n, courseName: course.name || '', semesterName: sem.name || '' }
  }), [noteList, courseList, semList])

  const filtered = useMemo(() => {
    if (!search) return enriched
    const q = search.toLowerCase()
    return enriched.filter(n => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || (n.tags || '').toLowerCase().includes(q))
  }, [enriched, search])

  async function handleSubmit(form) {
    setSaving(true)
    try {
      if (modal.data?.id) await adminApi.updateNote(modal.data.id, form)
      else await adminApi.createNote(form)
      reload()
      setModal(null)
    } catch (e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try { await adminApi.deleteNote(deleteTarget.id); reload() } catch (e) { alert('Error: ' + e.message) }
    setDeleteTarget(null)
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Catatan Akademik</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-secondary)' }}>{filtered.length} catatan</p>
        </div>
        {isAdmin && <AdminAddButton label="Tambah Catatan" onClick={() => setModal({ type: 'note' })} />}
      </div>

      <div style={{ position: 'relative' }}>
        <FiSearch size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari catatan..."
          style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><FiX size={14} /></button>}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🗒️</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Belum ada catatan</p>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{isAdmin ? 'Klik "Tambah Catatan" untuk mulai.' : 'Catatan akan ditampilkan di sini.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(note => (
            <NoteCard key={note.id} note={note} isOpen={!!openItems[note.id]} onToggle={() => setOpenItems(p => ({ ...p, [note.id]: !p[note.id] }))}
              isAdmin={isAdmin} onEdit={n => setModal({ type: 'note', data: n })} onDelete={setDeleteTarget} onReload={reload} />
          ))}
        </div>
      )}

      {modal && (
        <NoteModal data={modal.data} courses={courseList} semesters={semList} onSubmit={handleSubmit} onClose={() => setModal(null)} loading={saving} />
      )}
      <AdminDeleteModal open={!!deleteTarget} title="Hapus Catatan" description={deleteTarget ? `Hapus "${deleteTarget.title}"?` : ''} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
