import { useState, useMemo } from 'react'
import { FiChevronLeft, FiChevronRight, FiCalendar, FiList } from 'react-icons/fi'
import { useReading } from '../../reading/ReadingContext'
import ProgressBar from '../../reading/components/ProgressBar'
import { STATUS_COLOR, STATUS_EMOJI } from '../../reading/constants'

const DAYS_ID   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const isoDate = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

function MonthCalendar({ year, month, sessions, books, onDayClick, selectedDay }) {
  const today = new Date().toISOString().slice(0,10)
  const dayData = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      if (!map[s.date]) map[s.date]={pages:0,count:0}
      map[s.date].pages += s.pagesRead||0
      map[s.date].count++
    })
    return map
  }, [sessions])
  const bookEvents = useMemo(() => {
    const map = {}
    const add=(date,type,book)=>{ if(!date) return; if(!map[date]) map[date]=[]; map[date].push({type,book}) }
    const today = new Date().toISOString().slice(0,10)
    books.forEach(b=>{
      add(b.startDate,'start',b)
      add(b.targetDate,'target',b)
      // Pakai finishedDate jika ada, atau today jika status Selesai
      if (b.finishedDate) add(b.finishedDate,'done',b)
      else if (b.status === 'Selesai') add(today,'done',b)
    })
    return map
  }, [books])

  const firstDay = new Date(year,month,1).getDay()
  const daysInMonth = new Date(year,month+1,0).getDate()
  const cells=[]
  for(let i=0;i<firstDay;i++) cells.push(null)
  for(let d=1;d<=daysInMonth;d++) cells.push(d)

  const getIntensity = pages => {
    if(!pages) return null
    if(pages<20) return '#1e3a8a'; if(pages<40) return '#1d4ed8'; if(pages<60) return '#2563eb'; return '#4f8ef7'
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
        {DAYS_ID.map(d=>(
          <div key={d} style={{ textAlign:'center', fontSize:12, fontWeight:600, padding:'6px 0', color:'var(--text-muted)' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
        {cells.map((day,i) => {
          if(!day) return <div key={`e-${i}`}/>
          const key=isoDate(year,month,day)
          const data=dayData[key]
          const events=(bookEvents[key]||[])
          const isToday=key===today, isSel=key===selectedDay
          const bg=getIntensity(data?.pages)
          return (
            <button key={key} onClick={()=>onDayClick(key)}
              style={{ position:'relative', aspectRatio:'1', borderRadius:9, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop:6, cursor:'pointer', border:'none', transition:'all 0.15s',
                backgroundColor: isSel?'var(--accent)':bg||'var(--bg-hover)',
                outline: isToday?'2px solid var(--accent)':'none', outlineOffset:1 }}>
              <span style={{ fontSize:12, fontWeight: isToday||isSel?700:400, color: isSel?'#fff':bg?'#fff':'var(--text-primary)', lineHeight:1 }}>{day}</span>
              {data&&!isSel&&<span style={{fontSize:9,color:'#93c5fd',marginTop:2}}>{data.pages}p</span>}
              {events.length>0&&(
                <div style={{display:'flex',gap:2,marginTop:3,justifyContent:'center'}}>
                  {events.slice(0,3).map((ev,ei)=>(
                    <div key={ei} style={{width:5,height:5,borderRadius:'50%',backgroundColor:ev.type==='done'?'var(--success)':ev.type==='start'?'var(--warning)':'var(--danger)'}}/>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'8px 16px',marginTop:14,fontSize:12,color:'var(--text-muted)'}}>
        <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',backgroundColor:'var(--warning)',marginRight:4}}/>Mulai baca</span>
        <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',backgroundColor:'var(--success)',marginRight:4}}/>Selesai</span>
        <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',backgroundColor:'var(--danger)',marginRight:4}}/>Target</span>
        <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,backgroundColor:'#2563eb',marginRight:4}}/>Hari membaca</span>
      </div>
    </div>
  )
}

function DayDetail({ date, sessions, books }) {
  const daySess=sessions.filter(s=>s.date===date)
  const totPages=daySess.reduce((s,x)=>s+(x.pagesRead||0),0)
  const totMin=daySess.reduce((s,x)=>s+(x.duration||0),0)
  const events=[]
  books.forEach(b=>{
    if(b.startDate===date) events.push({type:'start',book:b})
    if(b.finishedDate===date) events.push({type:'done',book:b})
    if(b.targetDate===date) events.push({type:'target',book:b})
  })
  const bTitle=id=>books.find(b=>b.id===id)?.title||'—'
  if(!daySess.length&&!events.length) return <p style={{fontSize:14,color:'var(--text-muted)',textAlign:'center',padding:'32px 0'}}>Tidak ada aktivitas.</p>
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {daySess.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:4}}>
          {[['Halaman',totPages],['Menit',totMin],['Sesi',daySess.length]].map(([l,v])=>(
            <div key={l} style={{padding:'10px 8px',borderRadius:10,textAlign:'center',backgroundColor:'var(--bg-hover)'}}>
              <p style={{fontSize:18,fontWeight:700,color:'var(--text-primary)',lineHeight:1}}>{v}</p>
              <p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>{l}</p>
            </div>
          ))}
        </div>
      )}
      {daySess.map(s=>(
        <div key={s.id} style={{padding:'12px 14px',borderRadius:10,backgroundColor:'var(--bg-hover)'}}>
          <p style={{fontSize:13.5,fontWeight:500,color:'var(--text-primary)',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bTitle(s.bookId)}</p>
          <p style={{fontSize:12.5,color:'var(--text-secondary)'}}>Hal {s.startPage}–{s.endPage} · {s.pagesRead} hal · {s.duration} mnt</p>
          {s.notes&&<p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>{s.notes}</p>}
        </div>
      ))}
      {events.map((ev,i)=>{
        const cfg={start:{color:'var(--warning)',label:'Mulai membaca'},done:{color:'var(--success)',label:'Selesai membaca'},target:{color:'var(--danger)',label:'Target selesai'}}[ev.type]
        return (
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:10,backgroundColor:`color-mix(in srgb, ${cfg.color} 12%, transparent)`,border:`1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`}}>
            <div style={{width:10,height:10,borderRadius:'50%',backgroundColor:cfg.color,flexShrink:0}}/>
            <div style={{minWidth:0}}>
              <p style={{fontSize:12,fontWeight:600,color:cfg.color}}>{cfg.label}</p>
              <p style={{fontSize:13.5,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.book.title}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AnnualTimeline({ books, goals }) {
  const start=new Date(goals.startDate||'2026-11-01'), end=new Date(goals.endDate||'2027-10-31'), totalMs=end-start
  const getPos=dateStr=>{ if(!dateStr) return null; const d=new Date(dateStr); if(d<start||d>end) return null; return Math.max(0,Math.min(100,((d-start)/totalMs)*100)) }
  const monthMarkers=useMemo(()=>{
    const marks=[], d=new Date(start.getFullYear(),start.getMonth(),1)
    while(d<=end){ const pos=getPos(d.toISOString().slice(0,10)); if(pos!==null) marks.push({pos,label:d.toLocaleDateString('id-ID',{month:'short'})}); d.setMonth(d.getMonth()+1) }
    return marks
  },[goals])
  const today=new Date(), todayPos=getPos(today.toISOString().slice(0,10))
  const booksWithDates=books.filter(b=>b.startDate||b.finishedDate)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Month labels */}
      <div style={{position:'relative',height:20}}>
        {monthMarkers.map((m,i)=>(
          <div key={i} style={{position:'absolute',fontSize:11,color:'var(--text-muted)',transform:'translateX(-50%)',left:`${m.pos}%`}}>{m.label}</div>
        ))}
      </div>
      {/* Track */}
      <div style={{position:'relative',height:4,borderRadius:99,backgroundColor:'var(--bg-hover)'}}>
        {todayPos!==null&&(
          <div style={{position:'absolute',height:'100%',borderRadius:99,backgroundColor:'var(--accent)',width:`${todayPos}%`,transition:'width 0.6s ease'}}/>
        )}
        {todayPos!==null&&(
          <div style={{position:'absolute',width:12,height:12,borderRadius:'50%',border:'2px solid var(--bg-card)',backgroundColor:'var(--accent)',top:'50%',transform:'translate(-50%,-50%)',left:`${todayPos}%`}}/>
        )}
      </div>
      {/* Book rows */}
      {booksWithDates.length===0 ? (
        <p style={{fontSize:14,color:'var(--text-secondary)',textAlign:'center',padding:'32px 0'}}>Tambahkan tanggal mulai/selesai ke buku untuk timeline.</p>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {booksWithDates.map(book=>{
            const startPos=getPos(book.startDate), endPos=getPos(book.finishedDate||book.targetDate), donePos=getPos(book.finishedDate), targetPos=getPos(book.targetDate)
            const barStart=startPos??0, barEnd=endPos??barStart, barW=Math.max(0.5,barEnd-barStart)
            const color=STATUS_COLOR[book.status]
            return (
              <div key={book.id} style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:12.5,color:'var(--text-secondary)',width:140,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{STATUS_EMOJI[book.status]} {book.title}</span>
                <div style={{flex:1,position:'relative',height:24}}>
                  {startPos!==null&&(
                    <div style={{position:'absolute',height:16,top:4,borderRadius:5,opacity:0.85,backgroundColor:color,left:`${barStart}%`,width:`${Math.max(barW,1)}%`}} title={`${book.startDate} → ${book.finishedDate||book.targetDate||'?'}`}/>
                  )}
                  {targetPos!==null&&!donePos&&(
                    <div style={{position:'absolute',width:10,height:10,borderRadius:'50%',top:7,border:'2px solid var(--bg-card)',backgroundColor:'var(--danger)',left:`${targetPos}%`,transform:'translateX(-50%)'}} title={`Target: ${book.targetDate}`}/>
                  )}
                  {donePos!==null&&(
                    <div style={{position:'absolute',width:10,height:10,borderRadius:'50%',top:7,border:'2px solid var(--bg-card)',backgroundColor:'var(--success)',left:`${donePos}%`,transform:'translateX(-50%)'}} title={`Selesai: ${book.finishedDate}`}/>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{display:'flex',flexWrap:'wrap',gap:'6px 16px',paddingTop:8,borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-muted)'}}>
        <span>Bar warna = rentang baca</span>
        <span>🟢 Titik hijau = selesai</span>
        <span>🔴 Titik merah = target</span>
        <span>Periode: {goals.startDate} – {goals.endDate}</span>
      </div>
    </div>
  )
}

export default function ReadingCalendar() {
  const { books, sessions, goals } = useReading()
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.toISOString().slice(0,10))
  const [view, setView] = useState('calendar')

  const prevMonth=()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11)}else setCalMonth(m=>m-1) }
  const nextMonth=()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0)}else setCalMonth(m=>m+1) }
  const goToday=()=>{ setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelectedDay(today.toISOString().slice(0,10)) }

  const monthKey=`${calYear}-${String(calMonth+1).padStart(2,'0')}`
  const monthSessions=sessions.filter(s=>s.date.startsWith(monthKey))
  const monthPages=monthSessions.reduce((s,x)=>s+(x.pagesRead||0),0)
  const monthActiveDays=new Set(monthSessions.map(s=>s.date)).size
  const monthDone=books.filter(b=>b.finishedDate?.startsWith(monthKey)).length

  const btnSt=(active)=>({display:'flex',alignItems:'center',gap:7,padding:'7px 16px',borderRadius:9,fontSize:13.5,fontWeight:500,cursor:'pointer',border:'none',transition:'all 0.15s',backgroundColor:active?'var(--accent)':'transparent',color:active?'#fff':'var(--text-secondary)'})

  return (
    <div className="page-enter" style={{display:'flex',flexDirection:'column',gap:28}}>
      <div style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <div>
          <h1 style={{fontSize:'1.625rem',fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.02em',marginBottom:5}}>Reading Calendar</h1>
          <p style={{fontSize:14,color:'var(--text-secondary)'}}>Kalender aktivitas membaca dan timeline tahunan.</p>
        </div>
        <div style={{display:'flex',borderRadius:10,overflow:'hidden',border:'1px solid var(--border)',backgroundColor:'var(--bg-card)'}}>
          <button onClick={()=>setView('calendar')} style={btnSt(view==='calendar')}><FiCalendar size={14}/> Kalender</button>
          <button onClick={()=>setView('timeline')} style={btnSt(view==='timeline')}><FiList size={14}/> Timeline</button>
        </div>
      </div>

      {view==='calendar' ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2" style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
            {/* Nav */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <button onClick={prevMonth} style={{width:34,height:34,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',background:'none',border:'1px solid var(--border)',cursor:'pointer'}}>
                <FiChevronLeft size={16}/>
              </button>
              <div style={{textAlign:'center'}}>
                <h3 style={{fontSize:16,fontWeight:700,color:'var(--text-primary)'}}>{MONTHS_ID[calMonth]} {calYear}</h3>
                <p style={{fontSize:12.5,color:'var(--text-secondary)',marginTop:3}}>{monthPages} hal · {monthActiveDays} hari aktif · {monthDone} buku selesai</p>
              </div>
              <button onClick={nextMonth} style={{width:34,height:34,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',background:'none',border:'1px solid var(--border)',cursor:'pointer'}}>
                <FiChevronRight size={16}/>
              </button>
            </div>
            <MonthCalendar year={calYear} month={calMonth} sessions={sessions} books={books} selectedDay={selectedDay} onDayClick={setSelectedDay}/>
            <div style={{marginTop:14,display:'flex',justifyContent:'center'}}>
              <button onClick={goToday} style={{fontSize:13,padding:'6px 16px',borderRadius:99,backgroundColor:'var(--bg-hover)',color:'var(--accent)',border:'none',cursor:'pointer'}}>Ke Hari Ini</button>
            </div>
          </div>

          {/* Day detail */}
          <div style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
            <h3 style={{fontSize:14.5,fontWeight:600,color:'var(--text-primary)',marginBottom:16,lineHeight:1.4}}>
              {new Date(selectedDay+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </h3>
            <DayDetail date={selectedDay} sessions={sessions} books={books}/>
          </div>
        </div>
      ) : (
        <div style={{padding:'22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Timeline Tahunan: {goals.startDate} – {goals.endDate}</h3>
            <span style={{fontSize:13,color:'var(--text-muted)'}}>{books.filter(b=>b.startDate||b.finishedDate).length} buku dengan tanggal</span>
          </div>
          <AnnualTimeline books={books} goals={goals}/>
        </div>
      )}

      {/* Upcoming deadlines */}
      <div style={{padding:'20px 22px',borderRadius:16,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)'}}>
        <h3 style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:16}}>Deadline Mendatang (30 hari)</h3>
        {(()=>{
          const now=new Date(), limit=new Date(); limit.setDate(limit.getDate()+30)
          const upcoming=books.filter(b=>b.targetDate&&new Date(b.targetDate)>=now&&new Date(b.targetDate)<=limit)
            .map(b=>({book:b,diff:Math.ceil((new Date(b.targetDate)-now)/86400000)}))
            .sort((a,z)=>a.diff-z.diff)
          if(!upcoming.length) return <p style={{fontSize:14,color:'var(--text-muted)',textAlign:'center',padding:'24px 0'}}>Tidak ada deadline dalam 30 hari ke depan.</p>
          return (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {upcoming.map(({book,diff})=>(
                <div key={book.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:10,backgroundColor:'var(--bg-hover)'}}>
                  <div style={{width:48,textAlign:'center',flexShrink:0}}>
                    <p style={{fontSize:22,fontWeight:800,color:diff<=7?'var(--danger)':'var(--accent)',letterSpacing:'-0.02em',lineHeight:1}}>{diff}</p>
                    <p style={{fontSize:11,color:'var(--text-muted)'}}>hari</p>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13.5,fontWeight:500,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{book.title}</p>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                      <p style={{fontSize:12,color:'var(--text-secondary)'}}>{book.author}</p>
                      <span style={{fontSize:11.5,padding:'2px 7px',borderRadius:99,backgroundColor:`color-mix(in srgb, ${STATUS_COLOR[book.status]} 14%, transparent)`,color:STATUS_COLOR[book.status]}}>{STATUS_EMOJI[book.status]} {book.status}</span>
                    </div>
                    {book.totalPages&&(
                      <div style={{marginTop:8}}>
                        <ProgressBar value={book.currentPage||0} max={book.totalPages} height={4} showLabel={false}/>
                        <p style={{fontSize:11.5,color:'var(--text-muted)',marginTop:3}}>{book.currentPage||0}/{book.totalPages} hal</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
