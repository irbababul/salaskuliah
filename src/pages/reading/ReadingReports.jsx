import { useState, useMemo } from 'react'
import { FiDownload, FiCalendar, FiTrendingUp, FiStar } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell } from 'recharts'
import { useReading } from '../../reading/ReadingContext'
import ProgressBar from '../../reading/components/ProgressBar'
import { useAuth } from '../../contexts/AuthContext'

const COLORS = ['#4f8ef7','#34d399','#fbbf24','#f87171','#a78bfa','#22d3ee','#f472b6','#10b981']

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div style={{background:'var(--bg-card-alt)',border:'1px solid var(--border-strong)',borderRadius:10,padding:'8px 12px',fontSize:12}}><p style={{fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{label}</p>{payload.map(p=><p key={p.name} style={{color:p.color||p.fill||p.stroke}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}</p>)}</div>
}

function exportCSV(data, filename) {
  if(!data.length) return
  const headers=Object.keys(data[0]), rows=data.map(r=>headers.map(h=>JSON.stringify(r[h]??'')).join(','))
  const csv=[headers.join(','),...rows].join('\n')
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=filename; a.click()
}

function StatBox({ label, value, sub, color='var(--text-primary)' }) {
  return (
    <div style={{padding:'16px 18px',borderRadius:12,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
      <p style={{fontSize:'1.75rem',fontWeight:800,color,letterSpacing:'-0.03em',lineHeight:1}}>{value}</p>
      <p style={{fontSize:13,color:'var(--text-secondary)',marginTop:5}}>{label}</p>
      {sub&&<p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{sub}</p>}
    </div>
  )
}

function MonthlyReport({ books, sessions, goals }) {
  const months=useMemo(()=>{ const now=new Date(), r=[]; for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);r.push({key:d.toISOString().slice(0,7),label:d.toLocaleDateString('id-ID',{month:'long',year:'numeric'}),shortLabel:d.toLocaleDateString('id-ID',{month:'short',year:'2-digit'})})} return r },[])
  const [sel, setSel] = useState(months[months.length-1].key)

  const md = useMemo(()=>{
    const mSess=sessions.filter(s=>s.date.startsWith(sel))
    const mBooks=books.filter(b=>b.finishedDate?.startsWith(sel))
    const active=new Set(mSess.map(s=>s.date)).size
    const daysInMonth=new Date(parseInt(sel.slice(0,4)),parseInt(sel.slice(5,7)),0).getDate()
    const dayMap={}; mSess.forEach(s=>{dayMap[s.date]=(dayMap[s.date]||0)+(s.pagesRead||0)})
    const bestDay=Object.entries(dayMap).sort((a,b)=>b[1]-a[1])[0]
    const catMap={}; mBooks.forEach(b=>{const c=b.category||'Tanpa Kategori';catMap[c]=(catMap[c]||0)+1})
    const topCat=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0]
    const dailyData=Array.from({length:daysInMonth},(_,i)=>{const k=`${sel}-${String(i+1).padStart(2,'0')}`;return{day:i+1,pages:dayMap[k]||0}})
    const target=goals.monthlyBooks||7
    return { totalBooks:mBooks.length, totalPages:mSess.reduce((s,x)=>s+(x.pagesRead||0),0), totalMinutes:mSess.reduce((s,x)=>s+(x.duration||0),0), active, consistency:Math.round((active/daysInMonth)*100), bestDay:bestDay?{date:bestDay[0],pages:bestDay[1]}:null, topCat:topCat?topCat[0]:null, mBooks, dailyData, vsTarget:mBooks.length-target, target }
  },[sel,sessions,books,goals])

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Month selector */}
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {months.map(m=>(
          <button key={m.key} onClick={()=>setSel(m.key)}
            style={{height:32,padding:'0 12px',borderRadius:99,fontSize:12.5,fontWeight:sel===m.key?600:400,cursor:'pointer',border:`1px solid ${sel===m.key?'var(--accent)':'var(--border)'}`,backgroundColor:sel===m.key?'var(--accent)':'transparent',color:sel===m.key?'#fff':'var(--text-secondary)',transition:'all 0.15s'}}>
            {m.shortLabel}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <h3 style={{fontSize:16,fontWeight:600,color:'var(--text-primary)'}}>{months.find(m=>m.key===sel)?.label}</h3>
        <button onClick={()=>exportCSV(md.mBooks.map(b=>({Judul:b.title,Penulis:b.author,Kategori:b.category||'',Halaman:b.totalPages||'',Rating:b.rating||'',Selesai:b.finishedDate||''})),`laporan-${sel}.csv`)}
          style={{display:'flex',alignItems:'center',gap:6,height:34,padding:'0 12px',borderRadius:9,backgroundColor:'var(--bg-hover)',color:'var(--accent)',fontSize:13,border:'none',cursor:'pointer'}}>
          <FiDownload size={13}/> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Buku Selesai" value={md.totalBooks} sub={`target: ${md.target}`} color={md.totalBooks>=md.target?'var(--success)':'var(--text-primary)'} />
        <StatBox label="Halaman Dibaca" value={md.totalPages.toLocaleString()} color="var(--purple)" />
        <StatBox label="Total Jam" value={(md.totalMinutes/60).toFixed(1)} sub="jam membaca" color="var(--warning)" />
        <StatBox label="Hari Aktif" value={md.active} sub={`${md.consistency}% konsisten`} color="var(--accent)" />
      </div>

      {/* vs target banner */}
      <div style={{padding:'12px 16px',borderRadius:10,fontSize:13.5,backgroundColor:`color-mix(in srgb, ${md.vsTarget>=0?'var(--success)':'var(--warning)'} 10%, transparent)`,color:md.vsTarget>=0?'var(--success)':'var(--warning)',fontWeight:500}}>
        {md.vsTarget>=0?`✅ Target bulan ini tercapai! +${md.vsTarget} buku dari target.`:`⚠️ ${Math.abs(md.vsTarget)} buku di bawah target bulanan.`}
      </div>

      {/* Daily chart */}
      {md.dailyData.some(d=>d.pages>0)&&(
        <div style={{padding:'18px 20px',borderRadius:14,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <p style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:14}}>Halaman per Hari</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={md.dailyData} margin={{top:0,right:0,bottom:0,left:-28}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} interval={4}/>
              <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="pages" name="Halaman" fill="#4f8ef7" radius={[3,3,0,0]} maxBarSize={14}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best day & top category */}
      <div className="grid grid-cols-2 gap-3">
        {md.bestDay&&(
          <div style={{padding:'14px 16px',borderRadius:10,backgroundColor:'var(--bg-hover)'}}>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:5}}>Hari Paling Produktif</p>
            <p style={{fontSize:16,fontWeight:700,color:'var(--text-primary)'}}>{new Date(md.bestDay.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</p>
            <p style={{fontSize:13,color:'var(--accent)',marginTop:3}}>{md.bestDay.pages} halaman</p>
          </div>
        )}
        {md.topCat&&(
          <div style={{padding:'14px 16px',borderRadius:10,backgroundColor:'var(--bg-hover)'}}>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:5}}>Kategori Terbanyak</p>
            <p style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{md.topCat}</p>
          </div>
        )}
      </div>

      {/* Books list */}
      {md.mBooks.length>0&&(
        <div>
          <p style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:10}}>Buku Selesai Bulan Ini ({md.mBooks.length})</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {md.mBooks.map(b=>(
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,backgroundColor:'var(--bg-hover)'}}>
                <span style={{fontSize:18}}>📖</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13.5,fontWeight:500,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</p>
                  <p style={{fontSize:12.5,color:'var(--text-secondary)',marginTop:2}}>{b.author}</p>
                </div>
                {b.rating&&<span style={{fontSize:13,color:'var(--warning)',flexShrink:0}}>{'★'.repeat(b.rating)}</span>}
                {b.category&&<span style={{fontSize:11.5,padding:'2px 8px',borderRadius:99,backgroundColor:'var(--accent-dim)',color:'var(--accent-light)',flexShrink:0}}>{b.category}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AnnualReport({ books, sessions, goals }) {
  const done=books.filter(b=>b.status==='Selesai')
  const totalPages=sessions.reduce((s,x)=>s+(x.pagesRead||0),0)
  const totalMin=sessions.reduce((s,x)=>s+(x.duration||0),0)
  const yearly=goals.yearlyTarget||80

  const monthlyTrend=useMemo(()=>{
    const now=new Date()
    return Array.from({length:12},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-(11-i),1), key=d.toISOString().slice(0,7)
      return {month:d.toLocaleDateString('id-ID',{month:'short'}), Buku:books.filter(b=>b.finishedDate?.startsWith(key)).length, Jam:Math.round(sessions.filter(s=>s.date.startsWith(key)).reduce((s,x)=>s+(x.duration||0),0)/60)}
    })
  },[books,sessions])

  const catData=useMemo(()=>{
    const map={}; done.forEach(b=>{const c=b.category||'Tanpa Kategori';map[c]=(map[c]||0)+1})
    return Object.entries(map).map(([name,value],i)=>({name,value,fill:COLORS[i%COLORS.length]})).sort((a,b)=>b.value-a.value)
  },[done])

  const radarData=useMemo(()=>{
    const cats=['Filsafat','Psikologi','Data Science','Ekonomi','Sastra','Sejarah','Kepemimpinan','Pengembangan Diri']
    const total=done.length||1
    return cats.map(cat=>({subject:cat.length>10?cat.slice(0,10)+'…':cat,value:Math.round((books.filter(b=>b.category===cat).length/total)*100)}))
  },[done,books])

  const topRated=[...done].filter(b=>b.rating).sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,5)
  const avgRating=done.filter(b=>b.rating).length>0?(done.filter(b=>b.rating).reduce((s,b)=>s+b.rating,0)/done.filter(b=>b.rating).length).toFixed(1):'—'

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <h3 style={{fontSize:16,fontWeight:600,color:'var(--text-primary)'}}>Laporan Tahunan</h3>
        <button onClick={()=>exportCSV(done.map(b=>({Judul:b.title,Penulis:b.author,Kategori:b.category||'',Halaman:b.totalPages||'',Rating:b.rating||'',Mulai:b.startDate||'',Selesai:b.finishedDate||''})),`laporan-tahunan-${new Date().getFullYear()}.csv`)}
          style={{display:'flex',alignItems:'center',gap:6,height:34,padding:'0 12px',borderRadius:9,backgroundColor:'var(--bg-hover)',color:'var(--accent)',fontSize:13,border:'none',cursor:'pointer'}}>
          <FiDownload size={13}/> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Buku Selesai" value={done.length} sub={`/ ${yearly} target`} color={done.length>=yearly?'var(--success)':'var(--text-primary)'} />
        <StatBox label="Total Halaman" value={totalPages.toLocaleString()} color="var(--purple)" />
        <StatBox label="Total Jam" value={(totalMin/60).toFixed(0)} sub="jam membaca" color="var(--warning)" />
        <StatBox label="Rata-rata Rating" value={avgRating} sub="/ 5 bintang" color="var(--warning)" />
      </div>

      {/* Target progress */}
      <div style={{padding:'18px 20px',borderRadius:14,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:14,marginBottom:10}}>
          <span style={{color:'var(--text-primary)',fontWeight:500}}>Pencapaian Target {yearly} Buku</span>
          <span style={{fontWeight:700,color:'var(--accent)'}}>{Math.round((done.length/yearly)*100)}%</span>
        </div>
        <ProgressBar value={done.length} max={yearly} height={12} color={done.length>=yearly?'var(--success)':'var(--accent)'}/>
        <p style={{fontSize:12.5,color:done.length>=yearly?'var(--success)':'var(--text-muted)',marginTop:7}}>{done.length>=yearly?'🎉 Target tercapai!':`${yearly-done.length} buku lagi`}</p>
      </div>

      {/* Monthly trend */}
      <div style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
        <h4 style={{fontSize:14.5,fontWeight:600,color:'var(--text-primary)',marginBottom:16}}>Tren 12 Bulan</h4>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={monthlyTrend} margin={{top:0,right:4,bottom:0,left:-20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
            <XAxis dataKey="month" tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="Buku" fill="#4f8ef7" radius={[4,4,0,0]} maxBarSize={22}/>
            <Bar dataKey="Jam" fill="#fbbf24" radius={[4,4,0,0]} maxBarSize={22}/>
          </BarChart>
        </ResponsiveContainer>
        <p style={{fontSize:12,color:'var(--text-muted)',marginTop:8}}>Biru = buku selesai · Kuning = jam membaca</p>
      </div>

      {/* Pie + radar */}
      <div className="grid gap-5 lg:grid-cols-2">
        {catData.length>0&&(
          <div style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
            <h4 style={{fontSize:14.5,fontWeight:600,color:'var(--text-primary)',marginBottom:16}}>Distribusi Kategori</h4>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart><Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={2}>
                  {catData.map((e,i)=><Cell key={e.name} fill={e.fill}/>)}
                </Pie><Tooltip content={<Tip/>}/></PieChart>
              </ResponsiveContainer>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                {catData.slice(0,6).map(c=>(
                  <div key={c.name} style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5}}>
                    <div style={{width:9,height:9,borderRadius:'50%',backgroundColor:c.fill,flexShrink:0}}/>
                    <span style={{flex:1,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
                    <span style={{fontWeight:700,color:c.fill,flexShrink:0}}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <h4 style={{fontSize:14.5,fontWeight:600,color:'var(--text-primary)',marginBottom:16}}>Profil Bacaan</h4>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)"/>
              <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:'var(--text-muted)'}}/>
              <Radar name="Distribusi" dataKey="value" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.22}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top rated */}
      {topRated.length>0&&(
        <div style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <h4 style={{fontSize:14.5,fontWeight:600,color:'var(--text-primary)',marginBottom:14,display:'flex',alignItems:'center',gap:7}}>
            <FiStar size={15} style={{color:'var(--warning)'}}/> Buku Rating Tertinggi
          </h4>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {topRated.map((b,i)=>(
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,backgroundColor:'var(--bg-hover)'}}>
                <span style={{fontSize:15,fontWeight:800,width:22,textAlign:'center',flexShrink:0,color:i===0?'var(--warning)':'var(--text-muted)'}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13.5,fontWeight:500,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</p>
                  <p style={{fontSize:12.5,color:'var(--text-secondary)',marginTop:2}}>{b.author}</p>
                </div>
                <span style={{fontSize:13,color:'var(--warning)',flexShrink:0}}>{'★'.repeat(b.rating||0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annual eval */}
      <div style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
        <h4 style={{fontSize:14.5,fontWeight:600,color:'var(--text-primary)',marginBottom:14}}>📋 Evaluasi Tahunan</h4>
        <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:14,color:'var(--text-secondary)',lineHeight:1.65}}>
          <p>· Total buku: <strong style={{color:'var(--text-primary)'}}>{done.length}</strong> dari target <strong style={{color:'var(--accent)'}}>{yearly}</strong></p>
          <p>· Total halaman: <strong style={{color:'var(--text-primary)'}}>{totalPages.toLocaleString()}</strong></p>
          <p>· Total waktu: <strong style={{color:'var(--text-primary)'}}>{(totalMin/60).toFixed(0)}</strong> jam ({(totalMin/60/24).toFixed(1)} hari penuh)</p>
          <p>· Kategori favorit: <strong style={{color:'var(--text-primary)'}}>{catData[0]?.name||'—'}</strong></p>
          <p>· Buku rating terbaik: <strong style={{color:'var(--text-primary)'}}>{topRated[0]?.title||'—'}</strong></p>
          <p>· Evaluasi: {done.length>=yearly?<strong style={{color:'var(--success)'}}>🎉 Target tercapai!</strong>:<strong style={{color:'var(--warning)'}}>⚠️ Butuh {yearly-done.length} buku lagi</strong>}</p>
        </div>
      </div>
    </div>
  )
}

export default function ReadingReports() {
  const { books, sessions, goals } = useReading()
  const [tab, setTab] = useState('monthly')
  const bSt=(active)=>({flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px 16px',fontSize:14,fontWeight:500,cursor:'pointer',border:'none',transition:'all 0.15s',backgroundColor:active?'var(--accent)':'var(--bg-card)',color:active?'#fff':'var(--text-secondary)'})
  return (
    <div className="page-enter" style={{display:'flex',flexDirection:'column',gap:28}}>
      <div>
        <h1 style={{fontSize:'1.625rem',fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.02em',marginBottom:5}}>Reports</h1>
        <p style={{fontSize:14,color:'var(--text-secondary)'}}>Laporan bulanan dan tahunan aktivitas membacamu.</p>
      </div>
      <div style={{display:'flex',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
        <button onClick={()=>setTab('monthly')} style={bSt(tab==='monthly')}><FiCalendar size={15}/> Laporan Bulanan</button>
        <button onClick={()=>setTab('annual')}  style={bSt(tab==='annual')}> <FiTrendingUp size={15}/> Laporan Tahunan</button>
      </div>
      {tab==='monthly'
        ? <MonthlyReport books={books} sessions={sessions} goals={goals}/>
        : <AnnualReport  books={books} sessions={sessions} goals={goals}/>}
    </div>
  )
}
