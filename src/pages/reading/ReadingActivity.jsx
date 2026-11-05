import { useState, useEffect, useRef, useMemo } from 'react'
import { FiPlay, FiSquare, FiPlus, FiEdit2, FiTrash2, FiClock, FiCalendar, FiZap, FiShield, FiLock } from 'react-icons/fi'
import { useReading } from '../../reading/ReadingContext'
import Modal from '../../reading/components/Modal'
import EmptyState from '../../reading/components/EmptyState'
import ProgressBar from '../../reading/components/ProgressBar'
import { TextInput, TextareaInput, SelectInput } from '../../reading/components/InputField'
import { useAuth } from '../../contexts/AuthContext'

function useTimer() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)
  const intervalRef = useRef(null)
  const start = () => { startRef.current = Date.now() - elapsed * 1000; intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000); setRunning(true) }
  const stop  = () => { clearInterval(intervalRef.current); setRunning(false); return Math.ceil(elapsed / 60) }
  const reset = () => { clearInterval(intervalRef.current); setRunning(false); setElapsed(0) }
  useEffect(() => () => clearInterval(intervalRef.current), [])
  const fmt = () => { const h = Math.floor(elapsed/3600), m = Math.floor((elapsed%3600)/60), s = elapsed%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` }
  return { running, elapsed, minutes: Math.ceil(elapsed/60), start, stop, reset, fmt }
}

const emptyForm = () => ({ bookId: '', date: new Date().toISOString().slice(0,10), startPage: '', endPage: '', duration: '', notes: '' })

function SessionForm({ initial, books, prefillDuration, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...emptyForm(), ...initial }))
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const pagesRead = form.endPage && form.startPage ? Math.max(0, Number(form.endPage) - Number(form.startPage)) : 0
  useEffect(() => { if (prefillDuration && !form.duration) set('duration', String(prefillDuration)) }, [prefillDuration])
  const selectedBook = books.find(b => b.id === form.bookId)
  useEffect(() => { if (selectedBook && !initial?.startPage) set('startPage', String(selectedBook.currentPage || 0)) }, [form.bookId])
  const validate = () => {
    const e = {}
    if (!form.bookId) e.bookId = 'Pilih buku'
    if (!form.endPage) e.endPage = 'Halaman akhir wajib'
    if (form.startPage && form.endPage && Number(form.endPage) < Number(form.startPage)) e.endPage = 'Harus lebih besar dari awal'
    if (!form.duration || Number(form.duration) <= 0) e.duration = 'Durasi wajib diisi'
    setErrors(e); return Object.keys(e).length === 0
  }
  const handleSubmit = e => { e.preventDefault(); if (!validate()) return; onSave({ ...form, startPage: Number(form.startPage)||0, endPage: Number(form.endPage), pagesRead, duration: Number(form.duration) }) }
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SelectInput label="Buku" required value={form.bookId} onChange={e => set('bookId', e.target.value)} error={errors.bookId}>
        <option value="">Pilih buku...</option>
        {books.filter(b => b.status !== 'Selesai' || initial?.bookId === b.id).map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
      </SelectInput>
      <TextInput label="Tanggal" required value={form.date} onChange={e => set('date', e.target.value)} type="date" />
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Hal Awal" value={form.startPage} onChange={e => set('startPage', e.target.value)} type="number" placeholder="0" />
        <TextInput label="Hal Akhir" required value={form.endPage} onChange={e => set('endPage', e.target.value)} type="number" placeholder="52" error={errors.endPage} />
      </div>
      {pagesRead > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, backgroundColor: 'var(--success-dim)', color: 'var(--success)', fontSize: 13.5 }}>
          <FiZap size={14} /> {pagesRead} halaman akan dicatat
        </div>
      )}
      <TextInput label="Durasi (menit)" required value={form.duration} onChange={e => set('duration', e.target.value)} type="number" placeholder="30" error={errors.duration} />
      <TextareaInput label="Catatan Sesi" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Apa yang kamu baca hari ini?" rows={3} />
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" style={{ flex:1, height:42, borderRadius:10, backgroundColor:'var(--accent)', color:'#fff', fontSize:14, fontWeight:500, border:'none', cursor:'pointer' }}>Simpan Sesi</button>
        <button type="button" onClick={onCancel} style={{ flex:1, height:42, borderRadius:10, backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', fontSize:14, border:'none', cursor:'pointer' }}>Batal</button>
      </div>
    </form>
  )
}

function WeeklyBars({ sessions, goalPages }) {
  const days = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().slice(0, 10)
      const daySess = sessions.filter(s => s.date === key)
      const pages = daySess.reduce((sum, s) => sum + (s.pagesRead || 0), 0)
      return { key, label: d.toLocaleDateString('id-ID', { weekday: 'short' }), pages, minutes: daySess.reduce((sum, s) => sum + (s.duration || 0), 0), isToday: i === 6, met: pages >= goalPages }
    })
  }, [sessions, goalPages])
  const maxPages = Math.max(...days.map(d => d.pages), goalPages)
  const totalPages = days.reduce((s, d) => s + d.pages, 0)
  const activeDays = days.filter(d => d.pages > 0).length

  return (
    <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Minggu Ini</h3>
        <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>{totalPages} hal</span>
          <span>{activeDays}/7 hari</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {days.map(d => (
          <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: 32, borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease', height: maxPages > 0 ? `${Math.max(4, (d.pages / maxPages) * 64)}px` : 4, backgroundColor: d.isToday ? 'var(--accent)' : d.met ? 'var(--success)' : d.pages > 0 ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'var(--bg-hover)' }} />
            <span style={{ fontSize: 11, color: d.isToday ? 'var(--accent)' : 'var(--text-muted)' }}>{d.label}</span>
            {d.pages > 0 && <span style={{ fontSize: 11, color: d.met ? 'var(--success)' : 'var(--text-muted)' }}>{d.pages}</span>}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Target: {goalPages} hal/hari · Hijau = tercapai</p>
    </div>
  )
}

function SessionRow({ session, bookTitle, onEdit, onDelete, isAdmin }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>📖</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookTitle}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 3 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {session.date}</span>
          <span style={{ fontSize: 12, color: 'var(--accent)' }}>Hal {session.startPage}–{session.endPage}</span>
          <span style={{ fontSize: 12, color: 'var(--success)' }}>+{session.pagesRead} hal</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱ {session.duration} mnt</span>
        </div>
      </div>
      {isAdmin && <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={() => onEdit(session)} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', backgroundColor:'var(--bg-hover)', border:'none', cursor:'pointer' }}><FiEdit2 size={13} /></button>
        <button onClick={() => onDelete(session)} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', backgroundColor:'var(--bg-hover)', border:'none', cursor:'pointer' }}><FiTrash2 size={13} /></button>
      </div>}
    </div>
  )
}

export default function ReadingActivity() {
  const { books, sessions, goals, addSession, updateSession, deleteSession, computeStats } = useReading()
  const { isAdmin } = useAuth()
  const timer = useTimer()
  const [timerBookId, setTimerBookId] = useState('')
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editSession, setEditSession] = useState(null)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterDate, setFilterDate] = useState('')
  const [filterBookId, setFilterBookId] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const stats = useMemo(() => computeStats(), [computeStats])
  const activeBooks = books.filter(b => b.status === 'Sedang Dibaca' || b.status === 'Belum Dibaca')
  const today = new Date().toISOString().slice(0, 10)
  const todaySess = sessions.filter(s => s.date === today)
  const todayPages   = todaySess.reduce((s, x) => s + (x.pagesRead||0), 0)
  const todayMinutes = todaySess.reduce((s, x) => s + (x.duration||0), 0)
  const dailyGoal = goals.dailyPages || 52
  const todayPct = Math.min(100, Math.round((todayPages / dailyGoal) * 100))
  const filtered = useMemo(() => { let l = [...sessions]; if (filterDate) l = l.filter(s => s.date===filterDate); if (filterBookId) l = l.filter(s => s.bookId===filterBookId); return l }, [sessions, filterDate, filterBookId])
  const paginated = filtered.slice(0, page * PER_PAGE)
  const bookTitle = id => books.find(b => b.id === id)?.title || 'Buku dihapus'

  const handleTimerStop = () => { const min = timer.stop(); setTimerMinutes(min); setShowForm(true) }
  const handleSave = data => { if (editSession) updateSession(editSession.id, data); else addSession(data); setShowForm(false); setEditSession(null); setTimerMinutes(0); timer.reset(); setTimerBookId('') }
  const confirmDelete = () => { if (deleteConfirm) { deleteSession(deleteConfirm.id); setDeleteConfirm(null) } }

  const iSt = { height:36, padding:'0 12px', borderRadius:8, fontSize:13, color:'var(--text-primary)', backgroundColor:'var(--bg-card)', border:'1px solid var(--border-strong)', outline:'none', cursor:'pointer' }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 5 }}>Reading Activity</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Catat dan lacak sesi membacamu setiap hari.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {stats.currentStreak > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, fontSize: 13.5, fontWeight: 500, backgroundColor: 'var(--danger-dim)', color: 'var(--danger)' }}>🔥 Streak {stats.currentStreak} hari</span>}
          {isAdmin && <button onClick={() => { setEditSession(null); setTimerMinutes(0); setShowForm(true) }} style={{ display:'flex', alignItems:'center', gap:7, height:40, padding:'0 16px', borderRadius:10, backgroundColor:'var(--accent)', color:'#fff', fontSize:14, fontWeight:500, border:'none', cursor:'pointer' }}>
            <FiPlus size={15} /> Catat Manual
          </button>}
        </div>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2" style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiCalendar size={15} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Hari Ini · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
              </h3>
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: todayPct >= 100 ? 'var(--success)' : 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>{todayPct}%</span>
          </div>
          <ProgressBar value={todayPages} max={dailyGoal} height={10} color={todayPct >= 100 ? 'var(--success)' : 'var(--accent)'} />
          <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 14 }}>
            {[['Halaman', `${todayPages}/${dailyGoal}`], ['Menit', todayMinutes], ['Sesi', todaySess.length]].map(([l, v]) => (
              <div key={l}><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span> <span style={{ color: 'var(--text-secondary)' }}>{l}</span></div>
            ))}
          </div>
          {todayPct >= 100 && <p style={{ fontSize: 13.5, color: 'var(--success)', fontWeight: 600, marginTop: 10 }}>🎉 Target harian tercapai!</p>}
        </div>
        <div style={{ padding: '18px 20px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          {[['📄','Total hal',stats.totalPages.toLocaleString()],['⏱️','Total waktu',`${stats.totalHours}j`],['✅','Buku selesai',stats.doneBooks],['🔥','Streak',`${stats.currentStreak} hari`]].map(([ico,l,v]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{ico} {l}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly chart */}
      <WeeklyBars sessions={sessions} goalPages={dailyGoal} />

      {/* Timer */}
      <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FiClock size={15} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Timer Membaca</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <select value={timerBookId} onChange={e => setTimerBookId(e.target.value)} disabled={timer.running}
            style={{ flex: 1, minWidth: 180, height: 42, padding: '0 14px', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none', opacity: timer.running ? 0.6 : 1, cursor: timer.running ? 'default' : 'pointer' }}>
            <option value="">Pilih buku untuk timer...</option>
            {activeBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <span style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: timer.running ? 'var(--accent)' : 'var(--text-primary)', letterSpacing: '-0.02em', flexShrink: 0 }}>{timer.fmt()}</span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!timer.running ? (
              <button onClick={() => { if (!isAdmin) { setShowAccessModal(true); return; } timer.start(); }} disabled={!timerBookId} style={{ display:'flex', alignItems:'center', gap:7, height:42, padding:'0 18px', borderRadius:10, backgroundColor:'var(--success)', color:'#fff', fontSize:14, fontWeight:500, border:'none', cursor: timerBookId ? 'pointer' : 'not-allowed', opacity: timerBookId ? 1 : 0.4 }}>
                <FiPlay size={15} /> Mulai
              </button>
            ) : (
              <button onClick={handleTimerStop} style={{ display:'flex', alignItems:'center', gap:7, height:42, padding:'0 18px', borderRadius:10, backgroundColor:'var(--danger)', color:'#fff', fontSize:14, fontWeight:500, border:'none', cursor:'pointer' }}>
                <FiSquare size={15} /> Selesai
              </button>
            )}
            {!timer.running && timer.elapsed > 0 && (
              <button onClick={timer.reset} style={{ height:42, padding:'0 14px', borderRadius:10, backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', fontSize:14, border:'none', cursor:'pointer' }}>Reset</button>
            )}
          </div>
        </div>
        {timer.running && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>Timer berjalan... Klik Selesai untuk mencatat sesi.</p>}
      </div>

      {/* Session history */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Riwayat Sesi ({filtered.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1) }} style={iSt} />
            <select value={filterBookId} onChange={e => { setFilterBookId(e.target.value); setPage(1) }} style={iSt}>
              <option value="">Semua Buku</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
            {(filterDate || filterBookId) && <button onClick={() => { setFilterDate(''); setFilterBookId(''); setPage(1) }} style={{ ...iSt, backgroundColor:'var(--danger-dim)', color:'var(--danger)', border:'1px solid rgba(248,113,113,0.2)', display:'flex', alignItems:'center', gap:5, fontSize:12.5 }}>× Reset</button>}
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="📝" title="Belum ada sesi membaca" description="Mulai timer atau catat sesi manual." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {paginated.map(s => <SessionRow key={s.id} session={s} bookTitle={bookTitle(s.bookId)} onEdit={sess => { setEditSession(sess); setShowForm(true) }} onDelete={setDeleteConfirm} />)}
            {paginated.length < filtered.length && (
              <button onClick={() => setPage(p => p + 1)} style={{ padding: '12px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--accent)', fontSize: 13.5, cursor: 'pointer', marginTop: 4 }}>
                Muat lebih banyak ({filtered.length - paginated.length} lagi)
              </button>
            )}
          </div>
        )}
      </div>

﻿      {/* ── Access Restricted Modal ── */}
      {showAccessModal && (
        <div style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backgroundColor:'rgba(0,0,0,0.65)' }}
          onClick={() => setShowAccessModal(false)}>
          <div style={{ width:'100%',maxWidth:400,animation:'fadeInScale 0.25s cubic-bezier(0.4,0,0.2,1) both' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center',marginBottom:24 }}>
              <div style={{ width:68,height:68,borderRadius:20,background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 28px var(--accent-glow)' }}>
                <FiLock size={30} style={{ color:'#fff' }}/>
              </div>
            </div>
            <div style={{ backgroundColor:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:'28px 28px 24px',boxShadow:'var(--shadow-lg)' }}>
              <h2 style={{ fontSize:'1.25rem',fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.02em',marginBottom:10,textAlign:'center' }}>
                Akses Dibatasi
              </h2>
              <p style={{ fontSize:14,color:'var(--text-secondary)',lineHeight:1.65,textAlign:'center',marginBottom:22 }}>
                Fitur mencatat sesi membaca hanya tersedia untuk{' '}
                <strong style={{ color:'var(--text-primary)' }}>Admin</strong>.<br/>
                Login sebagai admin untuk menggunakan timer dan mencatat aktivitas.
              </p>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                <a href="/admin"
                  style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,height:46,borderRadius:12,background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)',color:'#fff',fontSize:14.5,fontWeight:600,textDecoration:'none',boxShadow:'0 4px 14px var(--accent-glow)' }}>
                  <FiShield size={16}/> Login sebagai Admin
                </a>
                <button onClick={() => setShowAccessModal(false)}
                  style={{ height:42,borderRadius:11,backgroundColor:'var(--bg-hover)',color:'var(--text-secondary)',fontSize:14,border:'none',cursor:'pointer' }}>
                  Tutup
                </button>
              </div>
            </div>
            <p style={{ textAlign:'center',fontSize:12.5,color:'var(--text-muted)',marginTop:16 }}>
              Kamu tetap bisa melihat statistik dan riwayat membaca.
            </p>
          </div>
        </div>
      )}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditSession(null); setTimerMinutes(0) }} title={editSession ? 'Edit Sesi' : 'Catat Sesi Membaca'}>
        <SessionForm initial={editSession ? { ...editSession, startPage: String(editSession.startPage), endPage: String(editSession.endPage), duration: String(editSession.duration) } : timerBookId ? { bookId: timerBookId } : undefined} books={books} prefillDuration={timerMinutes} onSave={handleSave} onCancel={() => { setShowForm(false); setEditSession(null); setTimerMinutes(0) }} />
      </Modal>
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Sesi">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Hapus sesi pada <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.date}</strong> ({deleteConfirm?.pagesRead} halaman)?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={confirmDelete} style={{ flex:1, height:42, borderRadius:10, backgroundColor:'var(--danger)', color:'#fff', fontSize:14, fontWeight:500, border:'none', cursor:'pointer' }}>Ya, Hapus</button>
            <button onClick={() => setDeleteConfirm(null)} style={{ flex:1, height:42, borderRadius:10, backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', fontSize:14, border:'none', cursor:'pointer' }}>Batal</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
