import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FiBook, FiFileText, FiEdit3, FiBookOpen,
  FiArrowRight, FiClock, FiAlertCircle,
  FiTrendingUp, FiSearch, FiLoader
} from 'react-icons/fi'
import StatCard from '../components/StatCard'
import FileCard from '../components/FileCard'
import { formatDate } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'
import { AdminAddButton } from '../components/AdminToolbar'
import { useApi } from '../hooks/useApi'
import { api } from '../utils/api'

/* ─── Spinner ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

/* ─── Quick Navigation Card ─────────────────────────────────── */
function NavCard({ to, icon: Icon, label, count, color, description }) {
  return (
    <Link to={to} style={{
      display: 'flex', flexDirection: 'column', gap: 14, padding: 20,
      borderRadius: 14, backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color, flexShrink: 0 }}>
          <Icon size={19} />
        </div>
        <FiArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</p>
        {description && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</p>}
        {count !== undefined && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{count} item tersedia</p>}
      </div>
    </Link>
  )
}

/* ─── Assignment Row ─────────────────────────────────────────── */
function AssignmentRow({ item, isLast }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'var(--warning-dim)', color: 'var(--warning)' }}>
        <FiFileText size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
        <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{item.course_name || item.course || ''}</p>
      </div>
      {item.due_date && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0 }}>
          <FiClock size={11} />
          <span>{formatDate(item.due_date)}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Semester overview card ─────────────────────────────────── */
function SemesterCard({ sem, courses }) {
  const courseList = courses.filter(c => c.semester_id === sem.id)
  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{sem.name}</h3>
        {sem.academic_year && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{sem.academic_year}</p>}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{courseList.length} mata kuliah</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {courseList.map(c => (
          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 500, backgroundColor: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
            {c.code ? `${c.code} - ${c.name}` : c.name}
          </span>
        ))}
        {courseList.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Belum ada mata kuliah</span>}
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────── */
export default function Dashboard() {
  const { isAdmin } = useAuth()
  const { data: dashData, loading, error } = useApi(() => api.getDashboard(), [], [])
  const { data: courses } = useApi(() => api.getCourses(), [], [])

  const stats = dashData?.stats || {}
  const announcements = dashData?.announcements || []
  const upcoming = dashData?.upcoming_deadlines || []
  const recentMaterials = dashData?.recent_materials || []
  const courseList = courses || []

  const { data: semesters } = useApi(() => api.getSemesters(), [], [])
  const semList = semesters || []

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* ── Welcome ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Selamat Datang 👋
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6, marginTop: 6 }}>
              SalasKuliah — pusat aset akademik kamu. Temukan materi, tugas, catatan, dan referensi di satu tempat.
            </p>
          </div>
          <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13.5, textDecoration: 'none', transition: 'all 0.15s', flexShrink: 0 }}>
            <FiSearch size={14} />
            Cari konten...
          </Link>
        </div>

        {/* Announcements */}
        {announcements.map(ann => (
          <div key={ann.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 12, backgroundColor: ann.priority === 'urgent' ? 'var(--error-dim)' : 'var(--warning-dim)', border: `1px solid ${ann.priority === 'urgent' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`, marginBottom: 10 }}>
            <FiAlertCircle size={16} style={{ color: ann.priority === 'urgent' ? 'var(--error)' : 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: ann.priority === 'urgent' ? 'var(--error)' : 'var(--warning)' }}>{ann.title}</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{ann.content}</p>
            </div>
          </div>
        ))}

        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 12, backgroundColor: 'var(--warning-dim)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <FiAlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--warning)' }}>Gagal memuat data</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>{error} — pastikan backend sudah aktif.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Statistics ── */}
      <section>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>RINGKASAN AKADEMIK</p>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Overview Konten</h2>
        </div>
        {loading ? <Spinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger">
            <StatCard icon="📚" label="Semester"  value={stats.semesters || 0}    color="var(--accent)" />
            <StatCard icon="📖" label="Materi"    value={stats.materials || 0}    color="var(--accent)" />
            <StatCard icon="📝" label="Tugas"     value={stats.assignments || 0}  color="var(--warning)" />
            <StatCard icon="🗒️" label="Catatan"   value={stats.notes || 0}        color="var(--success)" />
            <StatCard icon="📰" label="Literasi"  value={stats.literature || 0}   color="var(--purple)" />
          </div>
        )}
      </section>

      {/* ── Navigation & Deadlines ── */}
      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr' }} className="lg:grid-cols-5">
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>NAVIGASI CEPAT</p>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Menu Utama</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NavCard to="/materi"   icon={FiBook}     label="Materi"   count={stats.materials}    color="var(--accent)"  description="Bahan perkuliahan" />
            <NavCard to="/tugas"    icon={FiFileText}  label="Tugas"    count={stats.assignments}  color="var(--warning)" description="Daftar tugas" />
            <NavCard to="/catatan"  icon={FiEdit3}     label="Catatan"  count={stats.notes}        color="var(--success)" description="Catatan akademik" />
            <NavCard to="/literasi" icon={FiBookOpen}  label="Literasi" count={stats.literature}   color="var(--purple)"  description="Jurnal & referensi" />
          </div>
          <Link to="/reading" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, marginTop: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--success)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiTrendingUp size={19} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Reading Tracker</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>Lacak progres membaca buku</p>
            </div>
            <FiArrowRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>DEADLINE</p>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>7 Hari ke Depan</h2>
            </div>
            <Link to="/tugas" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Lihat semua <FiArrowRight size={13} />
            </Link>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '4px 18px' }}>
            {loading ? <Spinner /> : upcoming.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Tidak ada deadline dalam 7 hari ke depan.</p>
            ) : (
              upcoming.map((a, i) => <AssignmentRow key={a.id} item={a} isLast={i === upcoming.length - 1} />)
            )}
          </div>
        </div>
      </section>

      {/* ── Recent Materials ── */}
      {recentMaterials.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>MATERI</p>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Terbaru Ditambahkan</h2>
            </div>
            <Link to="/materi" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Lihat semua <FiArrowRight size={13} />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentMaterials.map(item => <FileCard key={item.id} item={{ ...item, title: item.title || item.name }} />)}
          </div>
        </section>
      )}

      {/* ── Semesters ── */}
      {semList.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>AKADEMIK</p>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Semester</h2>
            </div>
            {isAdmin && <AdminAddButton label="+ Tambah Semester" onClick={() => window.location.href = '/materi'} />}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {semList.map(sem => <SemesterCard key={sem.id} sem={sem} courses={courseList} />)}
          </div>
        </section>
      )}

    </div>
  )
}
