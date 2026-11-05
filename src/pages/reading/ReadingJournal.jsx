import { useState, useMemo } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiTag, FiBook, FiChevronDown } from 'react-icons/fi'
import { useReading } from '../../reading/ReadingContext'
import Modal from '../../reading/components/Modal'
import EmptyState from '../../reading/components/EmptyState'
import { TextInput, TextareaInput, SelectInput } from '../../reading/components/InputField'
import { useAuth } from '../../contexts/AuthContext'

const RKEYS = ['mainIdea','authorArgument','agreement','weaknesses','realApplication','newQuestions','quotes','reflection']
const RFIELDS = [
  { key:'mainIdea',       label:'1. Gagasan Utama',          placeholder:'Apa gagasan utama?', rows:3 },
  { key:'authorArgument', label:'2. Argumen Penulis',         placeholder:'Argumen penulis?', rows:3 },
  { key:'agreement',      label:'3. Setuju / Tidak?',         placeholder:'Kamu setuju? Mengapa?', rows:3 },
  { key:'weaknesses',     label:'4. Kelemahan / Kontradiksi', placeholder:'Apa kelemahannya?', rows:3 },
  { key:'realApplication',label:'5. Penerapan Nyata',         placeholder:'Bagaimana menerapkan?', rows:3 },
  { key:'newQuestions',   label:'6. Pertanyaan Baru',         placeholder:'Pertanyaan yang muncul?', rows:2 },
  { key:'quotes',         label:'Kutipan Penting',            placeholder:'Kutipan berkesan...', rows:3 },
  { key:'reflection',     label:'Refleksi Pribadi',           placeholder:'Catatan bebas...', rows:4 },
]
const emptyJ = () => { const o={title:'',bookId:'',chapterRef:'',content:'',tags:''}; RKEYS.forEach(k=>o[k]=''); return o }

function JForm({ initial, books, onSave, onCancel }) {
  const [form, setForm] = useState(() => { const base = {...emptyJ(), ...initial}; base.tags = Array.isArray(initial?.tags) ? initial.tags.join(', ') : (initial?.tags||''); return base })
  const [showTpl, setShowTpl] = useState(initial ? RKEYS.some(k=>initial[k]) : false)
  const [errors, setErrors] = useState({})
  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const validate = () => {
    const e={}
    if (!form.title.trim()) e.title='Judul wajib'
    if (!form.content.trim() && !RKEYS.some(k=>form[k]?.trim())) e.content='Isi catatan atau template'
    setErrors(e); return !Object.keys(e).length
  }
  const sub = e => { e.preventDefault(); if (!validate()) return; onSave({...form,tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean)}) }
  const bSt = { flex:1,height:42,borderRadius:10,fontSize:14,fontWeight:500,border:'none',cursor:'pointer' }
  return (
    <form onSubmit={sub} style={{display:'flex',flexDirection:'column',gap:16}}>
      <TextInput label="Judul" required value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Judul catatan..." error={errors.title} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput label="Buku Terkait" value={form.bookId} onChange={e=>set('bookId',e.target.value)}>
          <option value="">Pilih buku (opsional)...</option>
          {books.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}
        </SelectInput>
        <TextInput label="Bab/Halaman" value={form.chapterRef} onChange={e=>set('chapterRef',e.target.value)} placeholder="Bab 3, hal 45–60" />
      </div>
      <TextareaInput label="Isi Catatan" value={form.content} onChange={e=>set('content',e.target.value)} placeholder="Tulis catatan bebas..." rows={5} error={errors.content} />
      <TextInput label="Tag (pisahkan koma)" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="filsafat, logika" />
      {!showTpl ? (
        <button type="button" onClick={()=>setShowTpl(true)}
          style={{height:40,borderRadius:9,fontSize:13.5,cursor:'pointer',border:'2px dashed var(--border-strong)',backgroundColor:'transparent',color:'var(--text-secondary)'}}>
          + Gunakan Template Refleksi Kritis (6 Pertanyaan)
        </button>
      ) : (
        <div style={{padding:'18px 20px',borderRadius:12,backgroundColor:'var(--bg-card-alt)',border:'1px solid var(--border-strong)',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <p style={{fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>Template Refleksi</p>
            <button type="button" onClick={()=>setShowTpl(false)} style={{fontSize:13,color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>Sembunyikan</button>
          </div>
          {RFIELDS.map(({key,label,placeholder,rows})=>(
            <TextareaInput key={key} label={label} value={form[key]||''} onChange={e=>set(key,e.target.value)} placeholder={placeholder} rows={rows} />
          ))}
        </div>
      )}
      <div style={{display:'flex',gap:10,paddingTop:4}}>
        <button type="submit" style={{...bSt,backgroundColor:'var(--accent)',color:'#fff'}}>Simpan</button>
        <button type="button" onClick={onCancel} style={{...bSt,backgroundColor:'var(--bg-hover)',color:'var(--text-primary)'}}>Batal</button>
      </div>
    </form>
  )
}

function JCard({ journal, bTitle, onEdit, onDelete, onView, isAdmin }) {
  const hasTpl = RKEYS.some(k=>journal[k])
  return (
    <div onClick={()=>onView(journal)}
      style={{padding:'16px 18px',borderRadius:12,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)',cursor:'pointer',transition:'all 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-strong)';e.currentTarget.style.backgroundColor='var(--bg-card-alt)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.backgroundColor='var(--bg-card)'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:8}}>
        <h3 style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',lineHeight:1.4}}>{journal.title}</h3>
        {isAdmin && <div style={{display:'flex',gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>onEdit(journal)} style={{width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',backgroundColor:'var(--bg-hover)',border:'none',cursor:'pointer'}}><FiEdit2 size={13}/></button>
          <button onClick={()=>onDelete(journal)} style={{width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',backgroundColor:'var(--bg-hover)',border:'none',cursor:'pointer'}}><FiTrash2 size={13}/></button>
        </div>}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'3px 10px',marginBottom:8}}>
        {bTitle && <span style={{fontSize:12.5,color:'var(--accent)',display:'flex',alignItems:'center',gap:4}}><FiBook size={11}/>{bTitle}</span>}
        {journal.chapterRef && <span style={{fontSize:12,color:'var(--text-muted)'}}>{journal.chapterRef}</span>}
        <span style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(journal.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</span>
      </div>
      {journal.content && <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.55,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',marginBottom:8}}>{journal.content}</p>}
      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
        {hasTpl && <span style={{fontSize:11.5,padding:'2px 8px',borderRadius:99,backgroundColor:'var(--purple-dim)',color:'var(--purple)'}}>✍️ Refleksi</span>}
        {(journal.tags||[]).slice(0,3).map(t=>(
          <span key={t} style={{fontSize:11.5,padding:'2px 8px',borderRadius:99,backgroundColor:'var(--bg-hover)',color:'var(--text-muted)',display:'inline-flex',alignItems:'center',gap:4}}><FiTag size={9}/>{t}</span>
        ))}
      </div>
    </div>
  )
}

function JDetail({ journal, bTitle }) {
  const [exp, setExp] = useState({})
  const tplF = RFIELDS.filter(f=>journal[f.key]?.trim())
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:'4px 12px',fontSize:13}}>
        {bTitle && <span style={{color:'var(--accent)',display:'flex',alignItems:'center',gap:5}}><FiBook size={12}/> {bTitle}</span>}
        {journal.chapterRef && <span style={{color:'var(--text-muted)'}}>📄 {journal.chapterRef}</span>}
        <span style={{color:'var(--text-muted)'}}>📅 {new Date(journal.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</span>
      </div>
      {(journal.tags||[]).length > 0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {journal.tags.map(t=><span key={t} style={{fontSize:12.5,padding:'3px 9px',borderRadius:99,backgroundColor:'var(--bg-hover)',color:'var(--text-muted)'}}>#{t}</span>)}
        </div>
      )}
      {journal.content && <div style={{padding:14,borderRadius:10,backgroundColor:'var(--bg-hover)',fontSize:14,color:'var(--text-primary)',lineHeight:1.7}}>{journal.content}</div>}
      {tplF.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',marginBottom:4}}>TEMPLATE REFLEKSI</p>
          {tplF.map(({key,label})=>(
            <div key={key} style={{borderRadius:10,overflow:'hidden',border:'1px solid var(--border)'}}>
              <button type="button" onClick={()=>setExp(p=>({...p,[key]:!p[key]}))}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',backgroundColor:'var(--bg-hover)',border:'none',cursor:'pointer',textAlign:'left'}}>
                <span style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>{label}</span>
                <FiChevronDown size={13} style={{color:'var(--text-muted)',transform:exp[key]?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
              </button>
              {!exp[key] && <div style={{padding:'12px 14px',fontSize:13.5,color:'var(--text-secondary)',lineHeight:1.65}}>{journal[key]}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReadingJournal() {
  const { books, journals, addJournal, updateJournal, deleteJournal } = useReading()
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [filterBookId, setFilterBookId] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editJ, setEditJ] = useState(null)
  const [viewJ, setViewJ] = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)

  const bTitle = id => books.find(b=>b.id===id)?.title
  const allTags = useMemo(()=>{const s=new Set();journals.forEach(j=>(j.tags||[]).forEach(t=>s.add(t)));return [...s].sort()},[journals])
  const filtered = useMemo(()=>{
    let l=[...journals]
    if (search){const q=search.toLowerCase();l=l.filter(j=>j.title.toLowerCase().includes(q)||j.content?.toLowerCase().includes(q)||(j.tags||[]).some(t=>t.toLowerCase().includes(q))||RKEYS.some(k=>j[k]?.toLowerCase().includes(q)))}
    if (filterBookId) l=l.filter(j=>j.bookId===filterBookId)
    if (filterTag) l=l.filter(j=>(j.tags||[]).includes(filterTag))
    return l
  },[journals,search,filterBookId,filterTag])

  const save = d=>{if(editJ){updateJournal(editJ.id,d);if(viewJ?.id===editJ.id)setViewJ({...viewJ,...d})}else addJournal(d);setShowForm(false);setEditJ(null)}
  const confirmDel=()=>{if(delConfirm){deleteJournal(delConfirm.id);setDelConfirm(null);if(viewJ?.id===delConfirm.id)setViewJ(null)}}
  const iSt={height:36,padding:'0 12px',borderRadius:8,fontSize:13,color:'var(--text-primary)',backgroundColor:'var(--bg-card)',border:'1px solid var(--border-strong)',outline:'none',cursor:'pointer'}

  return (
    <div className="page-enter" style={{display:'flex',flexDirection:'column',gap:24}}>
      <div style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <div>
          <h1 style={{fontSize:'1.625rem',fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.02em',marginBottom:5}}>Reading Journal</h1>
          <p style={{fontSize:14,color:'var(--text-secondary)'}}>{journals.length} catatan · {journals.filter(j=>RKEYS.some(k=>j[k])).length} dengan refleksi</p>
        </div>
        {isAdmin && <button onClick={()=>{setEditJ(null);setShowForm(true)}} style={{display:'flex',alignItems:'center',gap:7,height:40,padding:'0 16px',borderRadius:10,backgroundColor:'var(--accent)',color:'#fff',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}>
          <FiPlus size={15}/> Tulis Catatan
        </button>}
      </div>

      <div style={{padding:'16px 18px',borderRadius:12,backgroundColor:'var(--bg-card)',border:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          <div style={{position:'relative',flex:1,minWidth:180}}>
            <FiSearch size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari catatan..." style={{...iSt,width:'100%',paddingLeft:36,paddingRight:search?32:12}}/>
            {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex'}}><FiX size={13}/></button>}
          </div>
          <select value={filterBookId} onChange={e=>setFilterBookId(e.target.value)} style={iSt}>
            <option value="">Semua Buku</option>
            {books.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <select value={filterTag} onChange={e=>setFilterTag(e.target.value)} style={iSt}>
            <option value="">Semua Tag</option>
            {allTags.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          {(search||filterBookId||filterTag)&&<button onClick={()=>{setSearch('');setFilterBookId('');setFilterTag('')}} style={{...iSt,backgroundColor:'var(--danger-dim)',color:'var(--danger)',border:'1px solid rgba(248,113,113,0.2)',display:'flex',alignItems:'center',gap:5,fontSize:12.5}}><FiX size={12}/> Reset</button>}
        </div>
        {allTags.length>0&&!filterTag&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {allTags.slice(0,20).map(t=>{
              const cnt=journals.filter(j=>(j.tags||[]).includes(t)).length
              return <button key={t} onClick={()=>setFilterTag(t)} style={{fontSize:12,padding:'3px 9px',borderRadius:99,cursor:'pointer',backgroundColor:'var(--bg-hover)',color:'var(--text-secondary)',border:'1px solid var(--border)',transition:'all 0.15s'}}>
                <FiTag size={9}/> {t} ({cnt})
              </button>
            })}
          </div>
        )}
      </div>

      {filtered.length===0 ? (
        <EmptyState icon="✍️" title="Belum ada catatan" description="Tulis catatan pertama. Gunakan template refleksi kritis untuk hasil lebih mendalam."
          action={isAdmin ? <button onClick={()=>{setEditJ(null);setShowForm(true)}} style={{display:'inline-flex',alignItems:'center',gap:7,height:40,padding:'0 16px',borderRadius:10,backgroundColor:'var(--accent)',color:'#fff',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}><FiPlus size={15}/> Tulis Catatan</button> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(j=><JCard key={j.id} journal={j} bTitle={bTitle(j.bookId)} onEdit={j=>{setEditJ(j);setShowForm(true)}} onDelete={setDelConfirm} onView={setViewJ} isAdmin={isAdmin}/>)}
        </div>
      )}

      <Modal open={showForm} onClose={()=>{setShowForm(false);setEditJ(null)}} title={editJ?'Edit Catatan':'Tulis Catatan Baru'} wide>
        <JForm initial={editJ} books={books} onSave={save} onCancel={()=>{setShowForm(false);setEditJ(null)}}/>
      </Modal>
      <Modal open={!!viewJ} onClose={()=>setViewJ(null)} title={viewJ?.title||''} wide>
        {viewJ&&(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <JDetail journal={viewJ} bTitle={bTitle(viewJ.bookId)}/>
            {isAdmin && <div style={{display:'flex',gap:10,paddingTop:12,borderTop:'1px solid var(--border)'}}>
              <button onClick={()=>{setEditJ(viewJ);setViewJ(null);setShowForm(true)}} style={{display:'flex',alignItems:'center',gap:7,height:40,padding:'0 16px',borderRadius:9,backgroundColor:'var(--accent)',color:'#fff',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}><FiEdit2 size={14}/> Edit</button>
              <button onClick={()=>{setDelConfirm(viewJ);setViewJ(null)}} style={{display:'flex',alignItems:'center',gap:7,height:40,padding:'0 16px',borderRadius:9,backgroundColor:'var(--danger-dim)',color:'var(--danger)',fontSize:14,border:'1px solid rgba(248,113,113,0.2)',cursor:'pointer'}}><FiTrash2 size={14}/> Hapus</button>
            </div>}
          </div>
        )}
      </Modal>
      <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="Hapus Catatan">
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <p style={{fontSize:14,color:'var(--text-secondary)',lineHeight:1.6}}>Hapus <strong style={{color:'var(--text-primary)'}}>{delConfirm?.title}</strong>?</p>
          <div style={{display:'flex',gap:10}}>
            <button onClick={confirmDel} style={{flex:1,height:42,borderRadius:10,backgroundColor:'var(--danger)',color:'#fff',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}>Ya, Hapus</button>
            <button onClick={()=>setDelConfirm(null)} style={{flex:1,height:42,borderRadius:10,backgroundColor:'var(--bg-hover)',color:'var(--text-primary)',fontSize:14,border:'none',cursor:'pointer'}}>Batal</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
