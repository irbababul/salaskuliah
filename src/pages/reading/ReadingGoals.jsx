import { useState, useMemo } from 'react'
import { FiSave, FiTarget, FiTrendingUp, FiCalendar, FiAlertCircle, FiCheckCircle, FiLock } from 'react-icons/fi'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useReading } from '../../reading/ReadingContext'
import ProgressBar from '../../reading/components/ProgressBar'
import { useAuth } from '../../contexts/AuthContext'

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color || p.stroke }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

function StatRow({ label, value, sub, color = 'var(--text-primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 5 }}>{sub}</span>}
      </div>
    </div>
  )
}

function MonthlyTable({ goals, stats }) {
  const months = useMemo(() => {
    const result = []
    const start = new Date(goals.startDate || '2026-11-01')
    const target = goals.monthlyBooks || 7
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const key = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      const done = stats.monthlyBooks[key] || 0
      const now = new Date()
      const isCurrent = key === now.toISOString().slice(0, 7)
      const isPast = d < new Date(now.getFullYear(), now.getMonth(), 1)
      result.push({ key, label, done, target, isCurrent, isPast })
    }
    return result
  }, [goals, stats])

  let cumDone = 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {months.map((m, i) => {
        cumDone += m.done
        const barColor = m.done >= m.target ? 'var(--success)' : m.isCurrent ? 'var(--accent)' : m.isPast ? 'var(--warning)' : 'var(--text-muted)'
        return (
          <div key={m.key} style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: m.isCurrent ? 'var(--accent-dim)' : 'var(--bg-hover)', border: '1px solid ' + (m.isCurrent ? 'rgba(79,142,247,0.25)' : 'transparent') }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: m.isCurrent ? 600 : 400, color: m.isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>{m.label}</span>
                {m.isCurrent && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 99, backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 600 }}>Saat ini</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Kumulatif: {cumDone}/{(i + 1) * (goals.monthlyBooks || 7)} ·{' '}
                <strong style={{ color: m.done >= m.target ? 'var(--success)' : m.isPast ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: 600 }}>
                  {m.done}/{m.target}
                </strong>
              </div>
            </div>
            <ProgressBar value={m.done} max={m.target} height={5} showLabel={false} color={barColor} />
          </div>
        )
      })}
    </div>
  )
}

function CumulativeChart({ goals, stats }) {
  const data = useMemo(() => {
    const start = new Date(goals.startDate || '2026-11-01')
    const yearly = goals.yearlyTarget || 80
    const monthly = goals.monthlyBooks || 7
    let cumDone = 0
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const key = d.toISOString().slice(0, 7)
      cumDone += stats.monthlyBooks[key] || 0
      return { month: d.toLocaleDateString('id-ID', { month: 'short' }), Aktual: cumDone, Target: Math.min(yearly, (i + 1) * monthly) }
    })
  }, [goals, stats])

  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
          <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.12} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTip />} />
        <Area type="monotone" dataKey="Target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gT)" dot={false} />
        <Area type="monotone" dataKey="Aktual" stroke="#3b82f6" strokeWidth={2} fill="url(#gA)" dot={{ r: 3, fill: '#3b82f6' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── Target Summary (read-only untuk user) ─────────────────── */
function TargetSummary({ goals, onTrack }) {
  const items = [
    { label: 'Target Tahunan', value: goals.yearlyTarget || 80, unit: 'buku', color: 'var(--accent)' },
    { label: 'Target Bulanan', value: goals.monthlyBooks || 7, unit: 'buku/bulan', color: 'var(--success)' },
    { label: 'Target Mingguan', value: goals.weeklyBooks || 1, unit: 'buku/minggu', color: 'var(--purple)' },
    { label: 'Target Harian', value: goals.dailyPages || 52, unit: 'halaman/hari', color: 'var(--warning)' },
    { label: 'Periode', value: (goals.startDate || '—') + ' s/d ' + (goals.endDate || '—'), unit: '', color: 'var(--text-primary)' },
  ]
  return (
    <div style={{ padding: '22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiTarget size={15} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Target Membaca</h3>
        </div>
        {/* Lock badge to indicate admin-only edit */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 99, backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
          <FiLock size={11} /> Dikelola admin
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map(({ label, value, unit, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color }}>{value} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>{unit}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReadingGoals() {
  const { goals, books, sessions, updateGoals, computeStats } = useReading()
  const { isAdmin } = useAuth()
  const stats = useMemo(() => computeStats(), [computeStats])
  const [form, setForm] = useState({ ...goals })
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setSaved(false) }

  const validate = () => {
    const e = {}
    if (!form.startDate) e.startDate = 'Wajib'
    if (!form.endDate) e.endDate = 'Wajib'
    if (form.startDate && form.endDate && form.endDate <= form.startDate) e.endDate = 'Harus setelah tanggal mulai'
    if (!form.yearlyTarget || form.yearlyTarget < 1) e.yearlyTarget = 'Minimal 1'
    if (!form.dailyPages || form.dailyPages < 1) e.dailyPages = 'Minimal 1'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    updateGoals({ ...form, yearlyTarget: Number(form.yearlyTarget), dailyPages: Number(form.dailyPages), weeklyBooks: Number(form.weeklyBooks), monthlyBooks: Number(form.monthlyBooks) })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const start = new Date(goals.startDate || '2026-11-01')
  const end = new Date(goals.endDate || '2027-10-31')
  const now = new Date()
  const totalDays = Math.ceil((end - start) / 86400000)
  const elapsedDays = Math.max(0, Math.ceil((now - start) / 86400000))
  const remainingDays = Math.max(0, Math.ceil((end - now) / 86400000))
  const expectedByNow = Math.round((elapsedDays / totalDays) * (goals.yearlyTarget || 80))
  const gap = stats.doneBooks - expectedByNow
  const neededPerMonth = remainingDays > 0 ? ((goals.yearlyTarget - stats.doneBooks) / (remainingDays / 30)).toFixed(1) : 0

  const onTrack = {
    ahead:    { color: 'var(--success)', text: '🚀 Lebih Cepat dari Jadwal' },
    on_track: { color: 'var(--accent)',  text: '✅ Sesuai Jadwal' },
    behind:   { color: 'var(--warning)', text: '⚠️ Tertinggal dari Jadwal' },
  }[stats.onTrack] || { color: 'var(--text-muted)', text: '—' }

  const inputSt = { width: '100%', height: 40, padding: '0 14px', borderRadius: 9, fontSize: 14, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none', fontFamily: 'inherit' }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 5 }}>Reading Goals</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Pantau target dan progres membacamu.</p>
        </div>
        <span style={{ padding: '7px 14px', borderRadius: 99, fontSize: 13.5, fontWeight: 500, backgroundColor: 'color-mix(in srgb, ' + onTrack.color + ' 14%, transparent)', color: onTrack.color }}>
          {onTrack.text}
        </span>
      </div>

      {/* ── Main grid: settings (admin) / summary (user) + progress ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* LEFT — Admin: form | User: read-only summary */}
        {isAdmin ? (
          <div style={{ padding: '22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <FiTarget size={15} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Pengaturan Target</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Target Tahunan <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" min={1} value={form.yearlyTarget} onChange={e => set('yearlyTarget', e.target.value)} style={{ ...inputSt, paddingRight: 40 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)' }}>buku</span>
                  </div>
                  {errors.yearlyTarget && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.yearlyTarget}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Target Harian <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" min={1} value={form.dailyPages} onChange={e => set('dailyPages', e.target.value)} style={{ ...inputSt, paddingRight: 52 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)' }}>hal/hari</span>
                  </div>
                  {errors.dailyPages && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.dailyPages}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Target Mingguan</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" min={1} value={form.weeklyBooks} onChange={e => set('weeklyBooks', e.target.value)} style={{ ...inputSt, paddingRight: 40 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)' }}>buku</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Target Bulanan</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" min={1} value={form.monthlyBooks} onChange={e => set('monthlyBooks', e.target.value)} style={{ ...inputSt, paddingRight: 40 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)' }}>buku</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Tanggal Mulai <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputSt} />
                  {errors.startDate && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.startDate}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Tanggal Akhir <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={inputSt} />
                  {errors.endDate && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.endDate}</p>}
                </div>
              </div>
              <button onClick={handleSave}
                style={{ height: 42, borderRadius: 10, backgroundColor: saved ? 'var(--success)' : 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background-color 0.2s' }}>
                {saved ? <><FiCheckCircle size={15} /> Tersimpan!</> : <><FiSave size={15} /> Simpan Target</>}
              </button>
            </div>
          </div>
        ) : (
          <TargetSummary goals={goals} onTrack={onTrack} />
        )}

        {/* RIGHT — Progress (semua user) */}
        <div style={{ padding: '22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <FiTrendingUp size={15} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Progres Saat Ini</h3>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Target {goals.yearlyTarget} buku</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{stats.progressPct}%</span>
            </div>
            <ProgressBar value={stats.doneBooks} max={goals.yearlyTarget} height={10} />
          </div>
          <div>
            <StatRow label="Buku selesai"         value={stats.doneBooks}   sub={'/ ' + goals.yearlyTarget}  color="var(--success)" />
            <StatRow label="Diharapkan sekarang"   value={expectedByNow}     sub="buku" />
            <StatRow label="Selisih jadwal"        value={gap >= 0 ? '+' + gap : gap} sub="buku"            color={gap >= 0 ? 'var(--success)' : 'var(--warning)'} />
            <StatRow label="Sisa buku"             value={stats.remainingBooks} sub="lagi" />
            <StatRow label="Hari tersisa"          value={remainingDays}     sub="hari" />
            <StatRow label="Kecepatan saat ini"    value={stats.booksPerMonth} sub="buku/bln" />
            <StatRow label="Kecepatan dibutuhkan"  value={neededPerMonth}    sub="buku/bln"                 color={parseFloat(neededPerMonth) > stats.booksPerMonth ? 'var(--warning)' : 'var(--success)'} />
          </div>
          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, fontSize: 13, backgroundColor: 'color-mix(in srgb, ' + (stats.onTrack === 'behind' ? 'var(--warning)' : 'var(--success)') + ' 10%, transparent)', color: stats.onTrack === 'behind' ? 'var(--warning)' : 'var(--success)' }}>
            {stats.onTrack === 'ahead'    && '🚀 ' + gap + ' buku di depan jadwal!'}
            {stats.onTrack === 'on_track' && '✅ Tepat pada jadwal. Terus konsisten!'}
            {stats.onTrack === 'behind'   && '⚠️ ' + Math.abs(gap) + ' buku tertinggal. Butuh ' + neededPerMonth + ' buku/bln.'}
          </div>
        </div>
      </div>

      {/* Grafik kumulatif */}
      <div style={{ padding: '22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <FiTrendingUp size={15} style={{ color: 'var(--purple)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Grafik Kumulatif</h3>
        </div>
        <CumulativeChart goals={goals} stats={stats} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Garis hijau putus = target · Biru = aktual</p>
      </div>

      {/* Target per bulan */}
      <div style={{ padding: '22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <FiCalendar size={15} style={{ color: 'var(--warning)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Target per Bulan</h3>
        </div>
        <MonthlyTable goals={goals} stats={stats} />
      </div>

      {/* Period cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Target Harian', unit: 'halaman', desc: 'Hari ini', color: 'var(--warning)',
            target: goals.dailyPages,
            actual: sessions.filter(s => s.date === new Date().toISOString().slice(0, 10)).reduce((s, x) => s + (x.pagesRead || 0), 0),
          },
          {
            label: 'Target Mingguan', unit: 'buku', desc: '7 hari terakhir', color: 'var(--accent)',
            target: goals.weeklyBooks,
            actual: (() => {
              const n = new Date()
              const week = Array.from({ length: 7 }, (_, i) => { const x = new Date(n); x.setDate(n.getDate() - i); return x.toISOString().slice(0, 10) })
              return books.filter(b => b.finishedDate && week.includes(b.finishedDate)).length
            })(),
          },
          {
            label: 'Target Bulanan', unit: 'buku', desc: 'Bulan ini', color: 'var(--success)',
            target: goals.monthlyBooks,
            actual: stats.monthlyBooks[new Date().toISOString().slice(0, 7)] || 0,
          },
        ].map(({ label, target, unit, desc, color, actual }) => {
          const pct = Math.min(100, Math.round((actual / target) * 100))
          const met = actual >= target
          return (
            <div key={label} style={{ padding: '18px 20px', borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid ' + (met ? 'rgba(52,211,153,0.3)' : 'var(--border)') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
                {met ? <FiCheckCircle size={14} style={{ color: 'var(--success)' }} /> : <FiAlertCircle size={14} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: met ? 'var(--success)' : color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
                {actual}<span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-secondary)' }}> / {target}</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{unit} · {desc}</p>
              <ProgressBar value={actual} max={target} height={5} showLabel={false} color={met ? 'var(--success)' : color} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
