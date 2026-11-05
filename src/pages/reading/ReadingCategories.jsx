import { useState, useMemo } from 'react'
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useReading } from '../../reading/ReadingContext'
import ProgressBar from '../../reading/components/ProgressBar'
import EmptyState from '../../reading/components/EmptyState'
import { STATUS_COLOR, STATUS_EMOJI } from '../../reading/constants'
import { useAuth } from '../../contexts/AuthContext'

const PALETTE = ['#4f8ef7','#34d399','#fbbf24','#f87171','#a78bfa','#22d3ee','#f472b6','#10b981','#fb923c','#818cf8','#a3e635','#2dd4bf','#c084fc']
const gc = i => PALETTE[i % PALETTE.length]

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, color: d.payload.color, marginBottom: 2 }}>{d.payload.name}</p>
      <p style={{ color: 'var(--text-primary)' }}>{d.value} buku</p>
    </div>
  )
}

function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

function CatCard({ isAdmin, name, color, books, isSelected, onSelect, onDelete }) {
  const done    = books.filter(b => b.status === 'Selesai').length
  const reading = books.filter(b => b.status === 'Sedang Dibaca').length
  return (
    <div onClick={() => onSelect(name)}
      style={{ padding: '14px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
        backgroundColor: isSelected ? `color-mix(in srgb, ${color} 10%, var(--bg-card))` : 'var(--bg-card)',
        border: `1px solid ${isSelected ? color + '55' : 'var(--border)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color }}>{books.length}</span>
          {isAdmin && <button onClick={e => { e.stopPropagation(); onDelete(name) }}
            style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--danger-dim)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.6' }}>
            <FiTrash2 size={12} />
          </button>}
        </div>
      </div>
      <ProgressBar value={done} max={Math.max(books.length, 1)} height={4} showLabel={false} color={color} />
      <div style={{ display: 'flex', gap: 10, marginTop: 7, fontSize: 12 }}>
        <span style={{ color: 'var(--success)' }}>✅ {done} selesai</span>
        <span style={{ color: 'var(--accent)' }}>📖 {reading} baca</span>
      </div>
    </div>
  )
}

export default function ReadingCategories() {
  const { books, categories, addCategory, deleteCategory } = useReading()
  const { isAdmin } = useAuth()
  const [newCat, setNewCat] = useState('')
  const [addErr, setAddErr] = useState('')
  const [selected, setSelected] = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)

  const catStats = useMemo(() =>
    categories.map((name, i) => ({
      name, color: gc(i),
      books: books.filter(b => b.category === name),
      done:  books.filter(b => b.category === name && b.status === 'Selesai').length,
    }))
  , [categories, books])

  const pieData = catStats.filter(c => c.books.length > 0)
  const barData = [...catStats].filter(c => c.books.length > 0).sort((a, b) => b.books.length - a.books.length).slice(0, 10)
    .map(c => ({ name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name, Buku: c.books.length, Selesai: c.done, color: c.color }))

  const uncategorized = books.filter(b => !b.category)
  const selCat = catStats.find(c => c.name === selected)

  const handleAdd = () => {
    const t = newCat.trim()
    if (!t) { setAddErr('Nama tidak boleh kosong'); return }
    if (categories.includes(t)) { setAddErr('Kategori sudah ada'); return }
    addCategory(t); setNewCat(''); setAddErr('')
  }
  const handleDel = name => setDelConfirm({ name, hasBooks: books.some(b => b.category === name) })
  const confirmDel = () => { if (delConfirm) { deleteCategory(delConfirm.name); if (selected === delConfirm.name) setSelected(null); setDelConfirm(null) } }

  const iSt = { height: 38, padding: '0 14px', borderRadius: 9, fontSize: 13.5, color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', outline: 'none' }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 5 }}>Categories</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{categories.length} kategori · {books.length} buku total</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Left: list + add ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isAdmin && <div style={{ padding: '16px 18px', borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Tambah Kategori</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newCat} onChange={e => { setNewCat(e.target.value); setAddErr('') }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Nama kategori baru..."
                style={{ ...iSt, flex: 1 }} />
              <button onClick={handleAdd}
                style={{ width: 38, height: 38, borderRadius: 9, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiPlus size={16} />
              </button>
            </div>
            {addErr && <p style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 5 }}>{addErr}</p>}
          </div>}

          {/* Category list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
            {catStats.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Belum ada kategori.</p>
            ) : (
              catStats.map(c => (
                <CatCard key={c.name} name={c.name} color={c.color} books={c.books} isAdmin={isAdmin}
                  isSelected={selected === c.name} onSelect={s => setSelected(sel => sel === s ? null : s)} onDelete={handleDel} />
              ))
            )}
            {uncategorized.length > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--bg-hover)', fontSize: 13, color: 'var(--text-muted)' }}>
                📦 {uncategorized.length} buku tanpa kategori
              </div>
            )}
          </div>
        </div>

        {/* ── Right: charts ── */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pieData.length === 0 ? (
            <EmptyState icon="📊" title="Belum ada data distribusi" description="Tambahkan buku dengan kategori." />
          ) : (
            <>
              {/* Pie */}
              <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>DISTRIBUSI</p>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>Komposisi Kategori</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={pieData} dataKey="books.length" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}
                        isAnimationActive={true}>
                        {pieData.map(c => <Cell key={c.name} fill={c.color} opacity={selected && selected !== c.name ? 0.35 : 1} />)}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        return <div style={{ background:'var(--bg-card-alt)',border:'1px solid var(--border-strong)',borderRadius:10,padding:'8px 12px',fontSize:12 }}><p style={{fontWeight:600,color:d.color}}>{d.name}</p><p style={{color:'var(--text-primary)'}}>{d.books.length} buku</p></div>
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pieData.map(c => (
                      <button key={c.name} onClick={() => setSelected(s => s === c.name ? null : c.name)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', border: 'none',
                          backgroundColor: selected === c.name ? `color-mix(in srgb, ${c.color} 12%, transparent)` : 'transparent',
                          outline: selected === c.name ? `1px solid ${c.color}44` : 'none' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>{c.books.length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bar */}
              <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>Buku per Kategori (Top 10)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<BarTip />} />
                    <Bar dataKey="Buku" radius={[0, 5, 5, 0]} maxBarSize={14}>
                      {barData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Bar>
                    <Bar dataKey="Selesai" fill="#34d399" opacity={0.7} radius={[0, 5, 5, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Bar warna = total · Hijau = selesai</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected category detail */}
      {selCat && (
        <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: `1px solid ${selCat.color}44` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: selCat.color }} />
              <h3 style={{ fontSize: 15.5, fontWeight: 600, color: selCat.color }}>{selCat.name}</h3>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({selCat.books.length} buku)</span>
            </div>
            <button onClick={() => setSelected(null)}
              style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <FiX size={15} />
            </button>
          </div>
          {selCat.books.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Belum ada buku di kategori ini.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {selCat.books.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--bg-hover)' }}>
                  <div style={{ width: 36, height: 48, borderRadius: 6, backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
                    {b.cover ? <img src={b.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.author}</p>
                  </div>
                  <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 99, backgroundColor: `color-mix(in srgb, ${STATUS_COLOR[b.status]} 14%, transparent)`, color: STATUS_COLOR[b.status], flexShrink: 0 }}>
                    {STATUS_EMOJI[b.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <div style={{ width: '100%', maxWidth: 420, borderRadius: 18, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Hapus Kategori</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Hapus <strong style={{ color: 'var(--text-primary)' }}>{delConfirm.name}</strong>?
              {delConfirm.hasBooks && ' Buku dalam kategori ini tidak ikut terhapus.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmDel} style={{ flex: 1, height: 42, borderRadius: 10, backgroundColor: 'var(--danger)', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Hapus</button>
              <button onClick={() => setDelConfirm(null)} style={{ flex: 1, height: 42, borderRadius: 10, backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 14, border: 'none', cursor: 'pointer' }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
