import { useState } from 'react'
import { FiBook, FiEdit3, FiUsers, FiCoffee, FiCheckSquare, FiPlus, FiX, FiClock } from 'react-icons/fi'

// ?? Default jadwal kuliah dari screenshot ?????????????????????
const KULIAH = [
  { hari: 'Senin',  nama: 'Aljabar Linier',          kode: 'SD211112', mulai: '09:35', selesai: '12:00', ruang: 'FIK-1, Lt.2, 202' },
  { hari: 'Selasa', nama: 'Statistika Regresi',        kode: 'SD211114', mulai: '07:00', selesai: '09:30', ruang: 'FIK-1, Lt.3, 304' },
  { hari: 'Selasa', nama: 'Analisis Numerik',           kode: 'SD211118', mulai: '09:35', selesai: '12:00', ruang: 'FIK-1, Lt.3, 304' },
  { hari: 'Selasa', nama: 'Bela Negara',               kode: 'UV21011',  mulai: '12:05', selesai: '14:30', ruang: 'GKB 1, Lt.3, 3.6' },
  { hari: 'Rabu',   nama: 'Analisis Data Eksploratif', kode: 'SD211123', mulai: '09:35', selesai: '12:00', ruang: 'FIK-1, Lt.3, 301' },
  { hari: 'Rabu',   nama: 'Matematika Diskrit',        kode: 'SD211111', mulai: '07:00', selesai: '09:30', ruang: 'Twin Tower B, Lt.7' },
  { hari: 'Kamis',  nama: 'Basis Data Lanjut',          kode: 'SD211115', mulai: '07:00', selesai: '09:30', ruang: 'FIK-1, Lt.3, 305' },
  { hari: 'Kamis',  nama: 'Bahasa Indonesia',           kode: 'UV21009',  mulai: '09:35', selesai: '11:10', ruang: 'GKB 1, Lt.3, 3.8' },
]

const HARI_LIST = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

const AKTIVITAS_DEF = [
  { id: 'tugas',     label: 'Tugas',      icon: FiCheckSquare, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'belajar',   label: 'Belajar',    icon: FiEdit3,       color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { id: 'buku',      label: 'Baca Buku',  icon: FiBook,        color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  { id: 'organisasi',label: 'Organisasi', icon: FiUsers,       color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { id: 'free',      label: 'Free',       icon: FiCoffee,      color: '#64748b', bg: 'rgba(100,116,139,0.12)'},
]

const DEFAULT_SLOTS = {
  Senin:   [{ type:'belajar', mulai:'06:00', selesai:'09:00', catatan:'Persiapan Aljabar Linier' }, { type:'tugas', mulai:'13:00', selesai:'15:00', catatan:'' }, { type:'free', mulai:'20:00', selesai:'22:00', catatan:'' }],
  Selasa:  [{ type:'buku', mulai:'15:00', selesai:'16:30', catatan:'' }, { type:'tugas', mulai:'19:00', selesai:'21:00', catatan:'' }],
  Rabu:    [{ type:'belajar', mulai:'06:00', selesai:'09:00', catatan:'Persiapan Analisis Data' }, { type:'organisasi', mulai:'14:00', selesai:'16:00', catatan:'' }, { type:'free', mulai:'20:00', selesai:'22:00', catatan:'' }],
  Kamis:   [{ type:'buku', mulai:'13:00', selesai:'14:30', catatan:'' }, { type:'tugas', mulai:'19:00', selesai:'21:00', catatan:'' }],
  Jumat:   [{ type:'belajar', mulai:'08:00', selesai:'10:00', catatan:'Review materi minggu ini' }, { type:'buku', mulai:'14:00', selesai:'16:00', catatan:'' }, { type:'free', mulai:'19:00', selesai:'21:00', catatan:'' }],
  Sabtu:   [{ type:'tugas', mulai:'09:00', selesai:'12:00', catatan:'Kerjakan tugas mingguan' }, { type:'organisasi', mulai:'14:00', selesai:'17:00', catatan:'' }, { type:'buku', mulai:'19:00', selesai:'21:00', catatan:'' }],
  Minggu:  [{ type:'free', mulai:'08:00', selesai:'12:00', catatan:'Istirahat' }, { type:'belajar', mulai:'15:00', selesai:'18:00', catatan:'Persiapan minggu depan' }, { type:'buku', mulai:'20:00', selesai:'21:30', catatan:'' }],
}

const STORAGE_KEY = 'sk_schedule'

function loadSchedule() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_SLOTS }
  catch { return DEFAULT_SLOTS }
}

// ?? Komponen slot aktivitas ???????????????????????????????????
function SlotCard({ slot, onEdit, onDelete }) {
  const def = AKTIVITAS_DEF.find(a => a.id === slot.type) || AKTIVITAS_DEF[4]
  const Icon = def.icon
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, backgroundColor:def.bg, border:`1px solid ${def.color}33` }}>
      <div style={{ width:32, height:32, borderRadius:8, backgroundColor:def.color+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={15} style={{ color:def.color }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{def.label}</p>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>{slot.mulai} ? {slot.selesai}{slot.catatan ? ' ? ' + slot.catatan : ''}</p>
      </div>
      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
        <button onClick={onEdit} style={{ width:26, height:26, borderRadius:6, border:'none', backgroundColor:'var(--bg-hover)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:12 }}>?</button>
        <button onClick={onDelete} style={{ width:26, height:26, borderRadius:6, border:'none', backgroundColor:'rgba(239,68,68,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', fontSize:12 }}>?</button>
      </div>
    </div>
  )
}

// ?? Modal tambah/edit slot ????????????????????????????????????
function SlotModal({ slot, onSave, onClose }) {
  const [form, setForm] = useState(slot || { type:'belajar', mulai:'08:00', selesai:'09:00', catatan:'' })
  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const inp = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', fontSize:13.5, outline:'none', boxSizing:'border-box' }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ backgroundColor:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', width:'100%', maxWidth:400, padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{slot ? 'Edit Aktivitas' : 'Tambah Aktivitas'}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><FiX size={18}/></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>Tipe Aktivitas</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {AKTIVITAS_DEF.map(a=>(
                <button key={a.id} type="button" onClick={()=>set('type',a.id)}
                  style={{ padding:'5px 12px', borderRadius:99, fontSize:12.5, fontWeight:600, border:'2px solid', borderColor:form.type===a.id?a.color:'var(--border)', backgroundColor:form.type===a.id?a.bg:'transparent', color:form.type===a.id?a.color:'var(--text-muted)', cursor:'pointer' }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>Mulai</label>
              <input type="time" value={form.mulai} onChange={e=>set('mulai',e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>Selesai</label>
              <input type="time" value={form.selesai} onChange={e=>set('selesai',e.target.value)} style={inp}/>
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>Catatan (opsional)</label>
            <input value={form.catatan} onChange={e=>set('catatan',e.target.value)} placeholder="mis. Kerjakan tugas statistika" style={inp}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:18, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:13.5 }}>Batal</button>
          <button onClick={()=>onSave(form)} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:13.5, fontWeight:600 }}>Simpan</button>
        </div>
      </div>
    </div>
  )
}

// ?? Main Page ?????????????????????????????????????????????????
export default function Schedule() {
  const today = HARI_LIST[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const [activeDay, setActiveDay] = useState(today)
  const [schedule, setSchedule] = useState(loadSchedule)
  const [modal, setModal] = useState(null) // { idx?: number } or null

  function save(newSched) {
    setSchedule(newSched)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSched))
  }

  function handleSaveSlot(form) {
    const daySlots = [...(schedule[activeDay] || [])]
    if (modal.idx !== undefined) daySlots[modal.idx] = form
    else daySlots.push(form)
    // Sort by time
    daySlots.sort((a,b) => a.mulai.localeCompare(b.mulai))
    save({ ...schedule, [activeDay]: daySlots })
    setModal(null)
  }

  function handleDelete(idx) {
    const daySlots = [...(schedule[activeDay] || [])]
    daySlots.splice(idx, 1)
    save({ ...schedule, [activeDay]: daySlots })
  }

  const kuliahHari = KULIAH.filter(k => k.hari === activeDay)
  const slotsHari = schedule[activeDay] || []

  // Hitung total durasi aktivitas
  function durasi(slot) {
    const [sh, sm] = slot.mulai.split(':').map(Number)
    const [eh, em] = slot.selesai.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  }
  const totalMenit = slotsHari.reduce((s, slot) => s + Math.max(0, durasi(slot)), 0)
  const totalKuliah = kuliahHari.reduce((s, k) => {
    const [sh, sm] = k.mulai.split(':').map(Number)
    const [eh, em] = k.selesai.split(':').map(Number)
    return s + (eh * 60 + em) - (sh * 60 + sm)
  }, 0)

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize:'1.625rem', fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Jadwal Harian</h1>
        <p style={{ fontSize:14, color:'var(--text-secondary)' }}>Kelola jadwal kuliah dan aktivitas harianmu</p>
      </div>

      {/* Day tabs */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {HARI_LIST.map(h => {
          const hasKuliah = KULIAH.some(k => k.hari === h)
          const isToday = h === today
          return (
            <button key={h} onClick={()=>setActiveDay(h)}
              style={{ padding:'8px 14px', borderRadius:10, border:'2px solid', fontSize:13.5, fontWeight:500, cursor:'pointer', transition:'all 0.15s',
                borderColor: activeDay===h ? 'var(--accent)' : isToday ? 'var(--success)' : 'var(--border)',
                backgroundColor: activeDay===h ? 'var(--accent-dim)' : 'var(--bg-card)',
                color: activeDay===h ? 'var(--accent)' : isToday ? 'var(--success)' : 'var(--text-secondary)',
                position:'relative'
              }}>
              {h}
              {hasKuliah && <span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', backgroundColor: activeDay===h?'var(--accent)':'var(--text-muted)' }}/>}
            </button>
          )
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="lg:grid-cols-2">
        {/* Jadwal Kuliah */}
        <div style={{ padding:'18px 20px', borderRadius:14, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:2 }}>KULIAH</p>
              <h2 style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{activeDay}</h2>
            </div>
            {kuliahHari.length > 0 && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{Math.floor(totalKuliah/60)}j {totalKuliah%60}m</span>}
          </div>
          {kuliahHari.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>
              Tidak ada kuliah hari ini
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {kuliahHari.map((k,i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'10px 12px', borderRadius:10, backgroundColor:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ width:32, height:32, borderRadius:8, backgroundColor:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FiBook size={14} style={{ color:'#818cf8' }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k.nama}</p>
                    <p style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:2 }}>{k.mulai} ? {k.selesai} ? {k.ruang}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aktivitas */}
        <div style={{ padding:'18px 20px', borderRadius:14, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:2 }}>AKTIVITAS</p>
              <h2 style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{activeDay}</h2>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {slotsHari.length > 0 && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{Math.floor(totalMenit/60)}j {totalMenit%60}m</span>}
              <button onClick={()=>setModal({})} style={{ height:30, padding:'0 10px', borderRadius:8, border:'none', backgroundColor:'var(--accent)', color:'#fff', fontSize:12.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <FiPlus size={13}/> Tambah
              </button>
            </div>
          </div>
          {slotsHari.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>Belum ada aktivitas</p>
              <button onClick={()=>setModal({})} style={{ padding:'7px 16px', borderRadius:8, border:'1px solid var(--accent)', backgroundColor:'var(--accent-dim)', color:'var(--accent)', fontSize:13, cursor:'pointer' }}>
                + Tambah Aktivitas
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {slotsHari.map((slot,i) => (
                <SlotCard key={i} slot={slot}
                  onEdit={()=>setModal({ idx:i, slot })}
                  onDelete={()=>handleDelete(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan aktivitas hari ini */}
      {slotsHari.length > 0 && (
        <div style={{ padding:'16px 18px', borderRadius:12, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}>
          <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:12 }}>RINGKASAN {activeDay.toUpperCase()}</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {AKTIVITAS_DEF.map(a => {
              const slots = slotsHari.filter(s => s.type === a.id)
              if (slots.length === 0) return null
              const menit = slots.reduce((s, slot) => s + Math.max(0, durasi(slot)), 0)
              const Icon = a.icon
              return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, backgroundColor:a.bg, border:`1px solid ${a.color}33` }}>
                  <Icon size={14} style={{ color:a.color }}/>
                  <span style={{ fontSize:13, fontWeight:500, color:a.color }}>{a.label}</span>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>{Math.floor(menit/60)}j{menit%60>0?' '+menit%60+'m':''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modal && (
        <SlotModal slot={modal.slot} onSave={handleSaveSlot} onClose={()=>setModal(null)}/>
      )}
    </div>
  )
}
