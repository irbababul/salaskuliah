import React, { useState, useRef, useMemo } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiGrid, FiList, FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useReading } from '../../reading/ReadingContext'
import Modal from '../../reading/components/Modal'
import ProgressBar from '../../reading/components/ProgressBar'
import EmptyState from '../../reading/components/EmptyState'
import { TextInput, TextareaInput, SelectInput } from '../../reading/components/InputField'
import { BOOK_STATUS, STATUS_COLOR, STATUS_EMOJI } from '../../reading/constants'
import { adminApi } from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'

/* ─── Helpers ────────────────────────────────────────────────── */
const SCOLOR = (status) => STATUS_COLOR[status] || 'var(--text-muted)'

function StatusPill({ status }) {
  const color = SCOLOR(status)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 500, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color, whiteSpace: 'nowrap' }}>
      {STATUS_EMOJI[status]} {status}
    </span>
  )
}

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button"
          onClick={() => !readonly && onChange && onChange(star === value ? null : star)}
          style={{ fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer', color: star <= (value || 0) ? 'var(--warning)' : 'var(--border)' }}>
          ★
        </button>
      ))}
    </div>
  )
}

/* ─── Book Form ──────────────────────────────────────────────── */
const EMPTY = { title: '', author: '', category: '', publisher: '', year: '', totalPages: '', cover: '', status: 'Belum Dibaca', startDate: '', targetDate: '', finishedDate: '', rating: null, notes: '' }

/* --- Cover Input dengan upload ke Drive --- */
function CoverInput({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [gisToken, setGisToken] = useState(window._cachedDriveToken || '')
  const inputRef = useRef()

  function handleSignIn() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '55856679506-u1606nt9se2pv3itspj6o6uhr6ghcsrn.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      hint: 'iirsalas9@gmail.com',
      callback: (r) => { if (r.access_token) { setGisToken(r.access_token); window._cachedDriveToken = r.access_token } },
    })
    tokenClient.requestAccessToken({ prompt: 'none', hint: 'iirsalas9@gmail.com' })
  }

  async function handleUpload(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('File harus gambar (jpg/png/webp)')
    if (!gisToken) return setError('Login Google dulu')
    setUploading(true); setError('')
    try {
      // Buat/cari folder COVERS di Drive
      const COVERS_FOLDER_ID = '1eHwBSzC2grRm2ozECXhmUipQSiPeOXx-'
      const metadata = { name: 'cover_' + Date.now() + '_' + file.name, mimeType: file.type, parents: [COVERS_FOLDER_ID] }
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', file)
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink,webViewLink', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + gisToken },
        body: form,
      })
      const data = await res.json()
      if (!data.id) throw new Error(data.error?.message || 'Upload gagal')
      // Buat file public supaya bisa ditampilkan sebagai gambar
      await fetch('https://www.googleapis.com/drive/v3/files/' + data.id + '/permissions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + gisToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
      })
      // Gunakan direct image URL
      const imageUrl = 'https://drive.google.com/thumbnail?id=' + data.id + '&sz=w400'
      onChange(imageUrl)
    } catch(e) { setError(e.message) }
    setUploading(false)
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Cover Buku</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder="https://... atau upload gambar"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}/>
        </div>
        {value && (
          <img src={value} alt="cover preview" style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)' }} onError={e=>e.target.style.display='none'}/>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {!gisToken ? (
            <button type="button" onClick={handleSignIn} style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Login Google
            </button>
          ) : (
            <button type="button" onClick={()=>inputRef.current?.click()} disabled={uploading}
              style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--accent)', backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: uploading?'wait':'pointer', whiteSpace: 'nowrap', opacity: uploading?0.6:1 }}>
              {uploading ? 'Uploading...' : 'Upload Gambar'}
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=>handleUpload(e.target.files[0])}/>
        </div>
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function BookForm({ initial = EMPTY, categories, onSave, onCancel }) {
  const [form, setForm] = useState, useRef({ ...EMPTY, ...initial })
  const [errors, setErrors] = useState, useRef({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Judul wajib diisi'
    if (!form.author.trim()) e.author = 'Penulis wajib diisi'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!validate()) return
    onSave({ ...form, totalPages: form.totalPages ? Number(form.totalPages) : null, year: form.year ? Number(form.year) : null })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput label="Judul Buku" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Judul buku..." error={errors.title} />
        <TextInput label="Penulis" required value={form.author} onChange={e => set('author', e.target.value)} placeholder="Nama penulis..." error={errors.author} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput label="Kategori" value={form.category} onChange={e => set('category', e.target.value)}>
          <option value="">Pilih kategori...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </SelectInput>
        <SelectInput label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
          {Object.values(BOOK_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextInput label="Penerbit" value={form.publisher} onChange={e => set('publisher', e.target.value)} />
        <TextInput label="Tahun" value={form.year} onChange={e => set('year', e.target.value)} type="number" placeholder="2024" />
        <TextInput label="Total Halaman" value={form.totalPages} onChange={e => set('totalPages', e.target.value)} type="number" placeholder="300" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextInput label="Tanggal Mulai" value={form.startDate} onChange={e => set('startDate', e.target.value)} type="date" />
        <TextInput label="Target Selesai" value={form.targetDate} onChange={e => set('targetDate', e.target.value)} type="date" />
        <TextInput label="Tgl Selesai" value={form.finishedDate} onChange={e => set('finishedDate', e.target.value)} type="date" />
      </div>
      <CoverInput value={form.cover} onChange={v => set('cover', v)} />
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Rating Pribadi</p>
        <StarRating value={form.rating} onChange={v => set('rating', v)} />
      </div>
      <TextareaInput label="Catatan & Ulasan" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Tulis catatan..." rows={3} />
      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <button type="submit" style={{ flex: 1, height: 42, borderRadius: 10, backgroundColor: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Simpan</button>
        <button type="button" onClick={onCancel} style={{ flex: 1, height: 42, borderRadius: 10, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Batal</button>
      </div>
    </form>
  )
}

/* ─── Book Detail ────────────────────────────────────────────── */
function BookDetail({ book, sessions, onEdit, onDelete, onClose, isAdmin }) {
  const bSessions = sessions.filter(s => s.bookId === book.id).sort((a, b) => b.date.localeCompare(a.date))
  const totPages = bSessions.reduce((s, x) => s + (x.pagesRead || 0), 0)
  const totMin   = bSessions.reduce((s, x) => s + (x.duration || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 60, height: 80, borderRadius: 10, backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden' }}>
          {book.cover ? <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 3 }}>{book.author}</p>
          {book.publisher && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>{book.publisher}{book.year ? ` · ${book.year}` : ''}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <StatusPill status={book.status} />
            {book.category && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 99, fontSize: 12, backgroundColor: 'var(--accent-dim)', color: 'var(--accent-light)' }}>{book.category}</span>}
          </div>
          {book.rating && <div style={{ marginTop: 8 }}><StarRating value={book.rating} readonly /></div>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ l: 'Total Hal', v: book.totalPages || '-' }, { l: 'Dibaca', v: `${book.currentPage || 0} hal` }, { l: 'Sesi', v: `${bSessions.length}x` }].map(({ l, v }) => (
          <div key={l} style={{ padding: '12px 8px', borderRadius: 10, textAlign: 'center', backgroundColor: 'var(--bg-hover)' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{v}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{l}</p>
          </div>
        ))}
      </div>

      {book.totalPages && (
        <div>
          <ProgressBar value={book.currentPage || 0} max={book.totalPages} height={8} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{Math.round(((book.currentPage || 0) / book.totalPages) * 100)}% selesai</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[['Mulai', book.startDate], ['Target', book.targetDate], ['Selesai', book.finishedDate]].map(([l, v]) => (
          <div key={l}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v || '—'}</p>
          </div>
        ))}
      </div>

      {book.notes && <div style={{ padding: 14, borderRadius: 10, backgroundColor: 'var(--bg-hover)', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{book.notes}</div>}

      {bSessions.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Riwayat Sesi · {totPages} hal · {totMin} mnt</p>
          <div style={{ maxHeight: '12rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bSessions.slice(0, 10).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--bg-hover)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.date}</span>
                <span style={{ color: 'var(--text-primary)' }}>Hal {s.startPage}–{s.endPage}</span>
                <span style={{ color: 'var(--accent)' }}>+{s.pagesRead} hal</span>
                <span style={{ color: 'var(--text-muted)' }}>{s.duration} mnt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        {isAdmin && <button onClick={onEdit} style={{ flex: 1, height: 40, borderRadius: 9, backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13.5, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FiEdit2 size={14} /> Edit
        </button>}
        {isAdmin && <button onClick={onDelete} style={{ height: 40, padding: '0 16px', borderRadius: 9, backgroundColor: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 13.5, fontWeight: 500, border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FiTrash2 size={14} /> Hapus
        </button>}
        <button onClick={onClose} style={{ height: 40, padding: '0 16px', borderRadius: 9, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13.5, border: 'none', cursor: 'pointer' }}>Tutup</button>
      </div>
    </div>
  )
}

/* ─── Book Card (Grid) ───────────────────────────────────────── */
function BookCard({ book, onClick }) {
  const pct = book.totalPages ? Math.round(((book.currentPage || 0) / book.totalPages) * 100) : null
  const color = SCOLOR(book.status)
  return (
    <div onClick={onClick} style={{ padding: 14, borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}>
      <div style={{ width: '100%', height: 180, borderRadius: 9, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, overflow: 'hidden', backgroundColor: 'var(--bg-hover)' }}>
        {book.cover ? <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 4 }}>{book.title}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{book.author}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusPill status={book.status} />
        {book.rating && <span style={{ fontSize: 12, color: 'var(--warning)' }}>{'★'.repeat(book.rating)}</span>}
      </div>
      {pct !== null && (
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={book.currentPage || 0} max={book.totalPages} height={4} showLabel={false} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{pct}%</p>
        </div>
      )}
    </div>
  )
}

/* ─── Book Row (List) ────────────────────────────────────────── */
function BookRow({ book, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card-alt)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
      <div style={{ width: 36, height: 48, borderRadius: 6, backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
        {book.cover ? <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</p>
      </div>
      <span className="hidden sm:block" style={{ fontSize: 12.5, color: 'var(--accent)', flexShrink: 0 }}>{book.category || '—'}</span>
      <div className="hidden sm:flex"><StatusPill status={book.status} /></div>
      {book.rating ? <span style={{ fontSize: 12.5, color: 'var(--warning)', flexShrink: 0 }}>{'★'.repeat(book.rating)}</span> : <span style={{ width: 48 }} />}
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', flexShrink: 0, width: 72, textAlign: 'right' }}>{book.totalPages ? `${book.totalPages} hal` : '—'}</span>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MyBooks() {
  const { books, sessions, categories, addBook, updateBook, deleteBook } = useReading()
  const { isAdmin } = useAuth()
  const [view, setView] = useState, useRef('grid')
  const [search, setSearch] = useState, useRef('')
  const [filterStatus, setFilterStatus] = useState, useRef('')
  const [filterCategory, setFilterCategory] = useState, useRef('')
  const [sortBy, setSortBy] = useState, useRef('createdAt')
  const [sortDir, setSortDir] = useState, useRef('desc')
  const [showForm, setShowForm] = useState, useRef(false)
  const [editBook, setEditBook] = useState, useRef(null)
  const [detailBook, setDetailBook] = useState, useRef(null)
  const [deleteConfirm, setDeleteConfirm] = useState, useRef(null)

  const filtered = useMemo(() => {
    let list = [...books]
    if (search) { const q = search.toLowerCase(); list = list.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q)) }
    if (filterStatus) list = list.filter(b => b.status === filterStatus)
    if (filterCategory) list = list.filter(b => b.category === filterCategory)
    list.sort((a, b) => {
      let va = a[sortBy] ?? '', vb = b[sortBy] ?? ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return list
  }, [books, search, filterStatus, filterCategory, sortBy, sortDir])

  const handleSave = d => {
    if (editBook) { updateBook(editBook.id, d); if (detailBook?.id === editBook.id) setDetailBook({ ...detailBook, ...d }) }
    else addBook(d)
    setShowForm(false); setEditBook(null)
  }
  const handleEdit = b => { setEditBook(b); setShowForm(true); setDetailBook(null) }
  const handleDelete = b => { setDeleteConfirm(b); setDetailBook(null) }
  const confirmDelete = () => { if (deleteConfirm) { deleteBook(deleteConfirm.id); setDeleteConfirm(null) } }

  const toggleSort = k => { if (sortBy === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(k); setSortDir('asc') } }
  const getSortIcon = k => sortBy === k ? (sortDir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />) : null

  const selectSt = { height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none', cursor: 'pointer' }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 5 }}>My Books</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{filtered.length} dari {books.length} buku</p>
        </div>
{isAdmin && <button onClick={() => { setEditBook(null); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 10, backgroundColor: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          <FiPlus size={16} /> Tambah Buku
        </button>}
      </div>

      {/* Filters */}
      <div style={{ padding: '16px 18px', borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari buku..." style={{ ...selectSt, width: '100%', paddingLeft: 36, paddingRight: search ? 32 : 12 }} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><FiX size={13} /></button>}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectSt}>
            <option value="">Semua Status</option>
            {Object.values(BOOK_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectSt}>
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectSt}>
            <option value="createdAt">Terbaru</option>
            <option value="title">Judul</option>
            <option value="finishedDate">Tgl Selesai</option>
            <option value="rating">Rating</option>
          </select>
          <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{ ...selectSt, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            {sortDir === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
            {[['grid', <FiGrid size={14} />], ['list', <FiList size={14} />]].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: view === v ? 'var(--accent)' : 'var(--bg-card)', color: view === v ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                {icon}
              </button>
            ))}
          </div>
          {(search || filterStatus || filterCategory) && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterCategory('') }}
              style={{ ...selectSt, backgroundColor: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiX size={12} /> Reset
            </button>
          )}
        </div>

        {/* Status quick tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['', ...Object.values(BOOK_STATUS)].map(s => {
            const count = s ? books.filter(b => b.status === s).length : books.length
            const active = filterStatus === s
            return (
              <button key={s || 'all'} onClick={() => setFilterStatus(s)}
                style={{ height: 28, padding: '0 12px', borderRadius: 99, fontSize: 12.5, fontWeight: active ? 600 : 400, cursor: 'pointer', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                {s || 'Semua'} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Book list */}
      {filtered.length === 0 ? (
        <EmptyState icon="📚" title="Belum ada buku"
          description="Tambahkan buku pertamamu untuk mulai melacak perjalanan membaca."
          action={isAdmin ? <button onClick={() => { setEditBook(null); setShowForm(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 10, backgroundColor: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}><FiPlus size={15} /> Tambah Buku</button> : undefined}
        />
      ) : view === 'grid' ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map(b => <BookCard key={b.id} book={b} onClick={() => setDetailBook(b)} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ width: 36, flexShrink: 0 }} />
            <button style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => toggleSort('title')}>Judul {getSortIcon('title')}</button>
            <span className="hidden sm:block" style={{ width: 100 }}>Kategori</span>
            <span className="hidden sm:block" style={{ width: 120 }}>Status</span>
            <button style={{ width: 64, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => toggleSort('rating')}>Rating {getSortIcon('rating')}</button>
            <span style={{ width: 72, textAlign: 'right' }}>Halaman</span>
          </div>
          {filtered.map(b => <BookRow key={b.id} book={b} onClick={() => setDetailBook(b)} />)}
        </div>
      )}

      {/* Modals */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditBook(null) }} title={editBook ? 'Edit Buku' : 'Tambah Buku'} wide>
        <BookForm initial={editBook || EMPTY} categories={categories} onSave={handleSave} onCancel={() => { setShowForm(false); setEditBook(null) }} />
      </Modal>
      <Modal open={!!detailBook} onClose={() => setDetailBook(null)} title="Detail Buku" wide>
        {detailBook && <BookDetail book={detailBook} sessions={sessions} onEdit={() => handleEdit(detailBook)} onDelete={() => handleDelete(detailBook)} onClose={() => setDetailBook(null)} isAdmin={isAdmin} />}
      </Modal>
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Buku">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Yakin ingin menghapus <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.title}</strong>? Semua sesi baca dan jurnal terkait juga akan dihapus.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={confirmDelete} style={{ flex: 1, height: 42, borderRadius: 10, backgroundColor: 'var(--danger)', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Ya, Hapus</button>
            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, height: 42, borderRadius: 10, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 14, border: 'none', cursor: 'pointer' }}>Batal</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
