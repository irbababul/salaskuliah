import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useReading } from '../../reading/ReadingContext'
import ReadingStatCard from '../../reading/components/ReadingStatCard'
import ProgressBar from '../../reading/components/ProgressBar'
import { STATUS_COLOR, STATUS_EMOJI, ACHIEVEMENTS_DEF } from '../../reading/constants'

/* ─── Chart tooltip ──────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: '#60a5fa' }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

/* ─── Reading Heatmap ────────────────────────────────────────── */
function ReadingHeatmap({ sessions }) {
  const cells = useMemo(() => {
    const pagesPerDay = {}
    sessions.forEach(s => { pagesPerDay[s.date] = (pagesPerDay[s.date] || 0) + (s.pagesRead || 0) })
    const result = []
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const startOffset = (today.getDay() + 6) % 7
    const start = new Date(today)
    start.setDate(start.getDate() - startOffset - 14 * 7)
    for (let i = 0; i < 105; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: key, pages: pagesPerDay[key] || 0, isToday: key === todayStr })
    }
    return result
  }, [sessions])

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const getColor = p => {
    if (!p) return 'var(--bg-hover)'
    if (p < 20) return '#1d4ed8'; if (p < 40) return '#2563eb'; if (p < 60) return '#3b82f6'
    return 'var(--success)'
  }

  return (
    <div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 3, minWidth: 'max-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map(cell => (
                <div key={cell.date} title={`${cell.date}: ${cell.pages} hal`}
                  style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: getColor(cell.pages), opacity: cell.pages === 0 ? 0.35 : 1, outline: cell.isToday ? '2px solid var(--accent)' : 'none', outlineOffset: 1, cursor: 'default' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>Sedikit</span>
        {[0, 15, 35, 60].map(p => <div key={p} style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: getColor(p), opacity: p === 0 ? 0.35 : 1 }} />)}
        <span>Banyak</span>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function ReadingDashboard() {
  const { books, sessions, goals, unlockedAchievements, computeStats } = useReading()
  const stats = useMemo(() => computeStats(), [computeStats])

  const monthlyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 8 }, (_, idx) => {
      const i = 7 - idx
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      return { month: d.toLocaleDateString('id-ID', { month: 'short' }), 'Selesai': stats.monthlyBooks[key] || 0 }
    })
  }, [stats])

  const onTrack = {
    ahead:    { text: 'Lebih Cepat 🚀', color: 'var(--success)' },
    on_track: { text: 'Sesuai Jadwal ✅', color: 'var(--accent)' },
    behind:   { text: 'Tertinggal ⚠️',  color: 'var(--warning)' },
  }[stats.onTrack]

  const currentBook = books.find(b => b.status === 'Sedang Dibaca')
  const lastSession = sessions[0]
  const recentAch = ACHIEVEMENTS_DEF.filter(a => unlockedAchievements.includes(a.id)).slice(-3)

  const S = (value, style) => <span style={style}>{value}</span>

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 6 }}>Reading Tracker</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-secondary)' }}>
            Target {stats.yearlyTarget} buku · {goals.startDate} – {goals.endDate}
          </p>
        </div>
        <span style={{ padding: '7px 14px', borderRadius: 99, fontSize: 13.5, fontWeight: 500, backgroundColor: `color-mix(in srgb, ${onTrack.color} 14%, transparent)`, color: onTrack.color }}>
          {onTrack.text}
        </span>
      </div>

      {/* ── Annual progress card ── */}
      <div style={{ padding: '22px 24px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>TARGET TAHUNAN</p>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Progress {stats.yearlyTarget} Buku</h2>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.progressPct}%</p>
        </div>
        <ProgressBar value={stats.doneBooks} max={stats.yearlyTarget} height={10} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>{stats.doneBooks}</strong> selesai</span>
          <span>{stats.remainingBooks} tersisa · {stats.remainingDays} hari lagi</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>STATISTIK</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ReadingStatCard icon="✅" label="Buku Selesai"   value={stats.doneBooks}                  color="var(--success)" />
          <ReadingStatCard icon="📖" label="Sedang Dibaca"  value={stats.readingBooks}                color="var(--accent)" />
          <ReadingStatCard icon="📚" label="Belum Mulai"    value={stats.unreadBooks}                 color="var(--text-secondary)" />
          <ReadingStatCard icon="📄" label="Total Halaman"  value={stats.totalPages.toLocaleString()}  color="var(--warning)" />
          <ReadingStatCard icon="🔥" label="Streak"         value={stats.currentStreak + " hari"}     color="var(--danger)" />
          <ReadingStatCard icon="📅" label="Buku/Bulan"     value={stats.booksPerMonth}               color="var(--accent)" />
          <ReadingStatCard icon="📑" label="Hal/Hari"       value={stats.pagesPerDay}                 color="var(--success)" />
          <ReadingStatCard icon="🎯" label="Target Harian"  value={(goals.dailyPages || 52) + " hal"} color="var(--warning)" />
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>GRAFIK</p>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>Buku Selesai per Bulan</h3>
          {stats.doneBooks === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Belum ada data. Mulai tambah buku!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="Selesai" fill="#3b82f6" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>AKTIVITAS</p>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>Heatmap 15 Minggu</h3>
          <ReadingHeatmap sessions={sessions} />
        </div>
      </div>

      {/* ── Current book + status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Sedang Dibaca</h3>
            <Link to="/reading/books" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Lihat semua →</Link>
          </div>
          {currentBook ? (
            <div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 52, height: 68, borderRadius: 10, backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, overflow: 'hidden' }}>
                  {currentBook.cover ? <img src={currentBook.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBook.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{currentBook.author}</p>
                  {currentBook.category && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3 }}>{currentBook.category}</p>}
                  <div style={{ marginTop: 10 }}>
                    <ProgressBar value={currentBook.currentPage || 0} max={currentBook.totalPages || 100} height={6} showLabel={false} />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Hal {currentBook.currentPage || 0} / {currentBook.totalPages || '?'}</p>
                  </div>
                </div>
              </div>
              {lastSession?.bookId === currentBook.id && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  Sesi terakhir: {lastSession.date} · {lastSession.pagesRead} hal · {lastSession.duration} mnt
                </p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
              Tidak ada buku aktif.<br />
              <Link to="/reading/books" style={{ color: 'var(--accent)' }}>Tambah buku →</Link>
            </div>
          )}
        </div>

        <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Distribusi Status</h3>
          {books.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>Belum ada buku.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(STATUS_COLOR).map(([status, color]) => {
                const count = books.filter(b => b.status === status).length
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{STATUS_EMOJI[status]} {status}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} buku</span>
                    </div>
                    <ProgressBar value={count} max={Math.max(books.length, 1)} color={color} height={6} showLabel={false} />
                  </div>
                )
              })}
            </div>
          )}
          {recentAch.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Pencapaian Terbaru</span>
                <Link to="/reading/achievements" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Lihat semua →</Link>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {recentAch.map(a => (
                  <div key={a.id} title={a.title} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {a.icon}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick nav ── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>MENU CEPAT</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { to: '/reading/books',    icon: '📚', label: 'My Books' },
            { to: '/reading/activity', icon: '📝', label: 'Catat Sesi' },
            { to: '/reading/goals',    icon: '🎯', label: 'Goals' },
            { to: '/reading/journal',  icon: '✍️', label: 'Journal' },
            { to: '/reading/reports',  icon: '📊', label: 'Reports' },
          ].map(({ to, icon, label }) => (
            <Link key={to} to={to} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '18px 12px', borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', textAlign: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
