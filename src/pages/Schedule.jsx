import { useState, useMemo } from 'react'
import { FiBook, FiEdit3, FiUsers, FiCoffee, FiCheckSquare, FiPlus, FiX, FiEdit2, FiTrash2, FiSettings } from 'react-icons/fi'

const HARI_LIST = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

const AKTIVITAS_DEF = [
  { id:'tugas',      label:'Tugas',      icon:FiCheckSquare, color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
  { id:'belajar',    label:'Belajar',    icon:FiEdit3,       color:'#3b82f6', bg:'rgba(59,130,246,0.12)'  },
  { id:'buku',       label:'Baca Buku',  icon:FiBook,        color:'#22c55e', bg:'rgba(34,197,94,0.12)'   },
  { id:'organisasi', label:'Organisasi', icon:FiUsers,       color:'#a855f7', bg:'rgba(168,85,247,0.12)'  },
  { id:'free',       label:'Free',       icon:FiCoffee,      color:'#64748b', bg:'rgba(100,116,139,0.12)' },
]

const DEFAULT_KULIAH = [
  { id:'k1', hari:'Senin',  nama:'Aljabar Linier',           kode:'SD211112', mulai:'09:35', selesai:'12:00', ruang:'FIK-1, Lt.2, 202' },
  { id:'k2', hari:'Selasa', nama:'Statistika Regresi',        kode:'SD211114', mulai:'07:00', selesai:'09:30', ruang:'FIK-1, Lt.3, 304' },
  { id:'k3', hari:'Selasa', nama:'Analisis Numerik',           kode:'SD211118', mulai:'09:35', selesai:'12:00', ruang:'FIK-1, Lt.3, 304' },
  { id:'k4', hari:'Selasa', nama:'Bela Negara',               kode:'UV21011',  mulai:'12:05', selesai:'14:30', ruang:'GKB 1, Lt.3, 3.6' },
  { id:'k5', hari:'Rabu',   nama:'Analisis Data Eksploratif', kode:'SD211123', mulai:'09:35', selesai:'12:00', ruang:'FIK-1, Lt.3, 301' },
  { id:'k6', hari:'Rabu',   nama:'Matematika Diskrit',        kode:'SD211111', mulai:'07:00', selesai:'09:30', ruang:'Twin Tower B, Lt.7'},
  { id:'k7', hari:'Kamis',  nama:'Basis Data Lanjut',          kode:'SD211115', mulai:'07:00', selesai:'09:30', ruang:'FIK-1, Lt.3, 305' },
  { id:'k8', hari:'Kamis',  nama:'Bahasa Indonesia',           kode:'UV21009',  mulai:'09:35', selesai:'11:10', ruang:'GKB 1, Lt.3, 3.8' },
]

const DEFAULT_SLOTS = {
  Senin:   [{type:'belajar',mulai:'06:00',selesai:'09:00',catatan:'Persiapan Aljabar Linier'},{type:'tugas',mulai:'13:00',selesai:'15:00',catatan:''},{type:'free',mulai:'20:00',selesai:'22:00',catatan:''}],
  Selasa:  [{type:'buku',mulai:'15:00',selesai:'16:30',catatan:''},{type:'tugas',mulai:'19:00',selesai:'21:00',catatan:''}],
  Rabu:    [{type:'belajar',mulai:'06:00',selesai:'09:00',catatan:'Persiapan Analisis Data'},{type:'organisasi',mulai:'14:00',selesai:'16:00',catatan:''},{type:'free',mulai:'20:00',selesai:'22:00',catatan:''}],
  Kamis:   [{type:'buku',mulai:'13:00',selesai:'14:30',catatan:''},{type:'tugas',mulai:'19:00',selesai:'21:00',catatan:''}],
  Jumat:   [{type:'belajar',mulai:'08:00',selesai:'10:00',catatan:'Review minggu ini'},{type:'buku',mulai:'14:00',selesai:'16:00',catatan:''},{type:'free',mulai:'19:00',selesai:'21:00',catatan:''}],
  Sabtu:   [{type:'tugas',mulai:'09:00',selesai:'12:00',catatan:'Tugas mingguan'},{type:'organisasi',mulai:'14:00',selesai:'17:00',catatan:''},{type:'buku',mulai:'19:00',selesai:'21:00',catatan:''}],
  Minggu:  [{type:'free',mulai:'08:00',selesai:'12:00',catatan:'Istirahat'},{type:'belajar',mulai:'15:00',selesai:'18:00',catatan:'Persiapan minggu depan'},{type:'buku',mulai:'20:00',selesai:'21:30',catatan:''}],
}

const SK = 'sk_schedule_v2'
const KK = 'sk_kuliah_v2'

function load(key, def) { try { return JSON.parse(localStorage.getItem(key)) || def } catch { return def } }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

function toMin(t) { const [h,m]=t.split(':').map(Number); return h*60+m }
function dur(a,b) { return Math.max(0, toMin(b)-toMin(a)) }
function fmt(min) { const h=Math.floor(min/60),m=min%60; return h>0?(m>0?h+'j '+m+'m':h+'j'):(m+'m') }

// ?? Timeline Bar ??????????????????????????????????????????????
function TimelineBar({ kuliah, slots }) {
  const START = 6*60, END = 23*60, TOTAL = END-START
  const pct = (min) => ((min-START)/TOTAL*100).toFixed(2)+'%'
  const w = (a,b) => (dur(a,b)/TOTAL*100).toFixed(2)+'%'

  return (
    <div style={{ padding:'16px 18px', borderRadius:12, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}>
      <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:10 }}>TIMELINE HARI INI</p>
      <div style={{ position:'relative', height:36, backgroundColor:'var(--bg-hover)', borderRadius:8, overflow:'hidden' }}>
        {kuliah.map((k,i)=>(
          <div key={i} title={k.nama+' '+k.mulai+'-'+k.selesai}
            style={{ position:'absolute', left:pct(toMin(k.mulai)), width:w(k.mulai,k.selesai), height:'100%', backgroundColor:'rgba(99,102,241,0.7)', borderRight:'2px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', paddingLeft:4, overflow:'hidden' }}>
            <span style={{ fontSize:10, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{k.kode}</span>
          </div>
        ))}
        {slots.map((s,i)=>{
          const def=AKTIVITAS_DEF.find(a=>a.id===s.type)||AKTIVITAS_DEF[4]
          return (
            <div key={i} title={def.label+' '+s.mulai+'-'+s.selesai}
              style={{ position:'absolute', left:pct(toMin(s.mulai)), width:w(s.mulai,s.selesai), height:'50%', top:'50%', backgroundColor:def.color+'99', borderRight:'2px solid '+def.color+'44', display:'flex', alignItems:'center', paddingLeft:4, overflow:'hidden' }}>
              <span style={{ fontSize:10, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{def.label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:'var(--text-muted)' }}>
        {['06:00','09:00','12:00','15:00','18:00','21:00','23:00'].map(t=><span key={t}>{t}</span>)}
      </div>
      <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:12, height:12, borderRadius:2, backgroundColor:'rgba(99,102,241,0.7)' }}/>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Kuliah</span>
        </div>
        {AKTIVITAS_DEF.map(a=>(
          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:12, height:6, borderRadius:2, backgroundColor:a.color+'99' }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ?? Kuliah Modal ??????????????????????????????????????????????
function KuliahModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {id:'k'+Date.now(),hari:'Senin',nama:'',kode:'',mulai:'07:00',selesai:'09:00',ruang:''})
  const set=(k,v)=>setForm(p=>({...p,[k]:v}))
  const inp={width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',backgroundColor:'var(--bg-hover)',color:'var(--text-primary)',fontSize:13.5,outline:'none',boxSizing:'border-box'}
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'60px 16px',overflowY:'auto'}}>
      <div style={{backgroundColor:'var(--bg-card)',borderRadius:16,border:'1px solid var(--border)',width:'100%',maxWidth:440,padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
          <h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>{item?'Edit Jadwal Kuliah':'Tambah Jadwal Kuliah'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}><FiX size={18}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Hari</label>
              <select value={form.hari} onChange={e=>set('hari',e.target.value)} style={inp}>
                {HARI_LIST.map(h=><option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Kode MK</label>
              <input value={form.kode} onChange={e=>set('kode',e.target.value)} placeholder="SD211112" style={inp}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Nama Mata Kuliah *</label>
            <input value={form.nama} onChange={e=>set('nama',e.target.value)} placeholder="Aljabar Linier" style={inp}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Mulai</label>
              <input type="time" value={form.mulai} onChange={e=>set('mulai',e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Selesai</label>
              <input type="time" value={form.selesai} onChange={e=>set('selesai',e.target.value)} style={inp}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Ruang</label>
            <input value={form.ruang} onChange={e=>set('ruang',e.target.value)} placeholder="FIK-1, Lt.2, 202" style={inp}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:18,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border)',background:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:13.5}}>Batal</button>
          <button onClick={()=>form.nama&&onSave(form)} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13.5,fontWeight:600}}>Simpan</button>
        </div>
      </div>
    </div>
  )
}

// ?? Aktivitas Modal ???????????????????????????????????????????
function AktivitasModal({ slot, onSave, onClose }) {
  const [form, setForm] = useState(slot || {type:'belajar',mulai:'08:00',selesai:'09:00',catatan:''})
  const set=(k,v)=>setForm(p=>({...p,[k]:v}))
  const inp={width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',backgroundColor:'var(--bg-hover)',color:'var(--text-primary)',fontSize:13.5,outline:'none',boxSizing:'border-box'}
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'60px 16px',overflowY:'auto'}}>
      <div style={{backgroundColor:'var(--bg-card)',borderRadius:16,border:'1px solid var(--border)',width:'100%',maxWidth:400,padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
          <h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>{slot?'Edit Aktivitas':'Tambah Aktivitas'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}><FiX size={18}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:8,display:'block'}}>Tipe</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {AKTIVITAS_DEF.map(a=>(
                <button key={a.id} type="button" onClick={()=>set('type',a.id)}
                  style={{padding:'5px 12px',borderRadius:99,fontSize:12.5,fontWeight:600,border:'2px solid',borderColor:form.type===a.id?a.color:'var(--border)',backgroundColor:form.type===a.id?a.bg:'transparent',color:form.type===a.id?a.color:'var(--text-muted)',cursor:'pointer'}}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Mulai</label>
              <input type="time" value={form.mulai} onChange={e=>set('mulai',e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Selesai</label>
              <input type="time" value={form.selesai} onChange={e=>set('selesai',e.target.value)} style={inp}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,color:'var(--text-secondary)',marginBottom:5,display:'block'}}>Catatan</label>
            <input value={form.catatan} onChange={e=>set('catatan',e.target.value)} placeholder="opsional..." style={inp}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:18,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border)',background:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:13.5}}>Batal</button>
          <button onClick={()=>onSave(form)} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13.5,fontWeight:600}}>Simpan</button>
        </div>
      </div>
    </div>
  )
}

// ?? Main ??????????????????????????????????????????????????????
export default function Schedule() {
  const dayIdx = new Date().getDay()
  const today = HARI_LIST[dayIdx === 0 ? 6 : dayIdx - 1]
  const [activeDay, setActiveDay] = useState(today)
  const [schedule, setSchedule] = useState(() => load(SK, DEFAULT_SLOTS))
  const [kuliah, setKuliah] = useState(() => load(KK, DEFAULT_KULIAH))
  const [actModal, setActModal] = useState(null)
  const [kuliahModal, setKuliahModal] = useState(null)
  const [tab, setTab] = useState('jadwal') // 'jadwal' | 'matkul'

  function saveSchedule(s) { setSchedule(s); save(SK, s) }
  function saveKuliah(k) { setKuliah(k); save(KK, k) }

  function handleSaveAkt(form) {
    const slots = [...(schedule[activeDay]||[])]
    if (actModal.idx !== undefined) slots[actModal.idx] = form
    else slots.push(form)
    slots.sort((a,b)=>a.mulai.localeCompare(b.mulai))
    saveSchedule({...schedule, [activeDay]:slots})
    setActModal(null)
  }

  function handleDelAkt(idx) {
    const slots = [...(schedule[activeDay]||[])]
    slots.splice(idx,1)
    saveSchedule({...schedule, [activeDay]:slots})
  }

  function handleSaveKuliah(form) {
    const idx = kuliah.findIndex(k=>k.id===form.id)
    const newK = idx>=0 ? kuliah.map((k,i)=>i===idx?form:k) : [...kuliah,form]
    saveKuliah(newK)
    setKuliahModal(null)
  }

  function handleDelKuliah(id) {
    saveKuliah(kuliah.filter(k=>k.id!==id))
  }

  const kuliahHari = kuliah.filter(k=>k.hari===activeDay).sort((a,b)=>a.mulai.localeCompare(b.mulai))
  const slotsHari = schedule[activeDay]||[]
  const totalKuliah = kuliahHari.reduce((s,k)=>s+dur(k.mulai,k.selesai),0)
  const totalAkt = slotsHari.reduce((s,sl)=>s+dur(sl.mulai,sl.selesai),0)

  return (
    <div className="page-enter" style={{display:'flex',flexDirection:'column',gap:24}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:'1.625rem',fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>Jadwal Harian</h1>
          <p style={{fontSize:14,color:'var(--text-secondary)'}}>Jadwal kuliah dan rencana aktivitas harianmu</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setTab('jadwal')} style={{padding:'8px 16px',borderRadius:8,border:'2px solid',borderColor:tab==='jadwal'?'var(--accent)':'var(--border)',backgroundColor:tab==='jadwal'?'var(--accent-dim)':'var(--bg-card)',color:tab==='jadwal'?'var(--accent)':'var(--text-secondary)',cursor:'pointer',fontSize:13.5,fontWeight:500}}>
            Jadwal
          </button>
          <button onClick={()=>setTab('matkul')} style={{padding:'8px 16px',borderRadius:8,border:'2px solid',borderColor:tab==='matkul'?'var(--warning)':'var(--border)',backgroundColor:tab==='matkul'?'var(--warning-dim)':'var(--bg-card)',color:tab==='matkul'?'var(--warning)':'var(--text-secondary)',cursor:'pointer',fontSize:13.5,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
            <FiSettings size={14}/> Kelola Jadwal Kuliah
          </button>
        </div>
      </div>

      {/* Tab: Kelola Matkul */}
      {tab==='matkul' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <p style={{fontSize:14,color:'var(--text-secondary)'}}>Atur jadwal kuliah semester ini. Perubahan langsung tersimpan di browser.</p>
            <button onClick={()=>setKuliahModal({})} style={{height:34,padding:'0 14px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              <FiPlus size={13}/> Tambah
            </button>
          </div>
          {HARI_LIST.map(h=>{
            const mk=kuliah.filter(k=>k.hari===h)
            if(mk.length===0) return null
            return (
              <div key={h} style={{padding:'14px 16px',borderRadius:12,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
                <p style={{fontSize:13,fontWeight:700,color:'var(--text-primary)',marginBottom:10}}>{h}</p>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {mk.map(k=>(
                    <div key={k.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,backgroundColor:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{k.nama} <span style={{fontSize:11,color:'#818cf8',fontWeight:400}}>({k.kode})</span></p>
                        <p style={{fontSize:11.5,color:'var(--text-muted)',marginTop:2}}>{k.mulai} - {k.selesai} &middot; {k.ruang}</p>
                      </div>
                      <button onClick={()=>setKuliahModal(k)} style={{width:28,height:28,borderRadius:7,border:'none',backgroundColor:'var(--bg-hover)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}><FiEdit2 size={13}/></button>
                      <button onClick={()=>handleDelKuliah(k.id)} style={{width:28,height:28,borderRadius:7,border:'none',backgroundColor:'rgba(239,68,68,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444'}}><FiTrash2 size={13}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Jadwal Harian */}
      {tab==='jadwal' && (<>
        {/* Day tabs */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {HARI_LIST.map(h=>{
            const hasK=kuliah.some(k=>k.hari===h)
            const isToday=h===today
            return (
              <button key={h} onClick={()=>setActiveDay(h)}
                style={{padding:'8px 14px',borderRadius:10,border:'2px solid',fontSize:13.5,fontWeight:500,cursor:'pointer',transition:'all 0.15s',
                  borderColor:activeDay===h?'var(--accent)':isToday?'var(--success)':'var(--border)',
                  backgroundColor:activeDay===h?'var(--accent-dim)':'var(--bg-card)',
                  color:activeDay===h?'var(--accent)':isToday?'var(--success)':'var(--text-secondary)',
                  position:'relative'}}>
                {h}
                {hasK&&<span style={{position:'absolute',top:4,right:4,width:5,height:5,borderRadius:'50%',backgroundColor:activeDay===h?'var(--accent)':'var(--text-muted)'}}/>}
              </button>
            )
          })}
        </div>

        {/* Timeline */}
        <TimelineBar kuliah={kuliahHari} slots={slotsHari}/>

        {/* Kuliah + Aktivitas */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
          {/* Kuliah */}
          <div style={{padding:'16px 18px',borderRadius:14,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:2}}>KULIAH</p>
                <h2 style={{fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>{activeDay} {totalKuliah>0&&<span style={{fontSize:12,fontWeight:400,color:'var(--text-muted)'}}>({fmt(totalKuliah)})</span>}</h2>
              </div>
            </div>
            {kuliahHari.length===0?(
              <p style={{fontSize:13,color:'var(--text-muted)',textAlign:'center',padding:'20px 0'}}>Tidak ada kuliah</p>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {kuliahHari.map(k=>(
                  <div key={k.id} style={{display:'flex',gap:10,padding:'10px 12px',borderRadius:10,backgroundColor:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
                    <div style={{width:32,height:32,borderRadius:8,backgroundColor:'rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <FiBook size={14} style={{color:'#818cf8'}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.nama}</p>
                      <p style={{fontSize:11.5,color:'var(--text-muted)',marginTop:2}}>{k.mulai} - {k.selesai} &middot; {k.ruang}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aktivitas */}
          <div style={{padding:'16px 18px',borderRadius:14,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:2}}>AKTIVITAS</p>
                <h2 style={{fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>{activeDay} {totalAkt>0&&<span style={{fontSize:12,fontWeight:400,color:'var(--text-muted)'}}>({fmt(totalAkt)})</span>}</h2>
              </div>
              <button onClick={()=>setActModal({})} style={{height:30,padding:'0 10px',borderRadius:8,border:'none',backgroundColor:'var(--accent)',color:'#fff',fontSize:12.5,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                <FiPlus size={13}/> Tambah
              </button>
            </div>
            {slotsHari.length===0?(
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:8}}>Belum ada aktivitas</p>
                <button onClick={()=>setActModal({})} style={{padding:'6px 14px',borderRadius:8,border:'1px solid var(--accent)',backgroundColor:'var(--accent-dim)',color:'var(--accent)',fontSize:12.5,cursor:'pointer'}}>+ Tambah</button>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {slotsHari.map((s,i)=>{
                  const def=AKTIVITAS_DEF.find(a=>a.id===s.type)||AKTIVITAS_DEF[4]
                  const Icon=def.icon
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 11px',borderRadius:10,backgroundColor:def.bg,border:'1px solid '+def.color+'33'}}>
                      <div style={{width:30,height:30,borderRadius:7,backgroundColor:def.color+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Icon size={13} style={{color:def.color}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{def.label}</p>
                        <p style={{fontSize:11.5,color:'var(--text-muted)'}}>{s.mulai} - {s.selesai}{s.catatan?' - '+s.catatan:''}</p>
                      </div>
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        <button onClick={()=>setActModal({idx:i,slot:s})} style={{width:26,height:26,borderRadius:6,border:'none',backgroundColor:'var(--bg-hover)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}><FiEdit2 size={12}/></button>
                        <button onClick={()=>handleDelAkt(i)} style={{width:26,height:26,borderRadius:6,border:'none',backgroundColor:'rgba(239,68,68,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444'}}><FiTrash2 size={12}/></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan */}
        {(kuliahHari.length>0||slotsHari.length>0)&&(
          <div style={{padding:'14px 16px',borderRadius:12,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
            <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:10}}>RINGKASAN {activeDay.toUpperCase()}</p>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {totalKuliah>0&&(
                <div style={{display:'flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:10,backgroundColor:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
                  <FiBook size={13} style={{color:'#818cf8'}}/>
                  <span style={{fontSize:13,fontWeight:500,color:'#818cf8'}}>Kuliah</span>
                  <span style={{fontSize:12,color:'var(--text-muted)'}}>{fmt(totalKuliah)}</span>
                </div>
              )}
              {AKTIVITAS_DEF.map(a=>{
                const slots=slotsHari.filter(s=>s.type===a.id)
                if(slots.length===0) return null
                const menit=slots.reduce((s,sl)=>s+dur(sl.mulai,sl.selesai),0)
                const Icon=a.icon
                return (
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:10,backgroundColor:a.bg,border:'1px solid '+a.color+'33'}}>
                    <Icon size={13} style={{color:a.color}}/>
                    <span style={{fontSize:13,fontWeight:500,color:a.color}}>{a.label}</span>
                    <span style={{fontSize:12,color:'var(--text-muted)'}}>{fmt(menit)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </>)}

      {actModal&&<AktivitasModal slot={actModal.slot} onSave={handleSaveAkt} onClose={()=>setActModal(null)}/>}
      {kuliahModal&&<KuliahModal item={kuliahModal.id?kuliahModal:null} onSave={handleSaveKuliah} onClose={()=>setKuliahModal(null)}/>}
    </div>
  )
}
