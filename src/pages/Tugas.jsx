import { useState, useMemo, useRef, useEffect } from 'react'
import { FiFileText, FiClock, FiX, FiUploadCloud, FiFile, FiEye, FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { AdminAddButton, AdminActions, AdminDeleteModal } from '../components/AdminToolbar'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../utils/helpers'
import { useApi } from '../hooks/useApi'
import { adminApi, api } from '../utils/api'

/* --- Upload Modal dengan file_type --- */
function UploadModal({ assignmentId, courseName, courseDriveFolderId, onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [fileType, setFileType] = useState('soal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()
  const [gisToken, setGisToken] = useState('')

  useEffect(() => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '55856679506-u1606nt9se2pv3itspj6o6uhr6ghcsrn.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      hint: 'iirsalas9@gmail.com',
      callback: (r) => { if (r.access_token) { setGisToken(r.access_token); window._cachedDriveToken = r.access_token } },
    })
    window._driveTokenClient = tokenClient
    if (window._cachedDriveToken) setGisToken(window._cachedDriveToken)
    else try { tokenClient.requestAccessToken({ prompt: '' }) } catch(e) {}
  }, [])

  function handleSignIn() { if (window._driveTokenClient) window._driveTokenClient.requestAccessToken({ prompt: 'none', hint: 'iirsalas9@gmail.com' }) }

  async function handleUpload() {
    if (!file) return setError('Pilih file dulu')
    if (!gisToken) return setError('Silakan login Google terlebih dahulu')
    setLoading(true); setError('')
    try {
      const parentFolders = courseDriveFolderId ? [courseDriveFolderId] : []
      const metadata = { name: fileType.toUpperCase() + '_' + file.name, mimeType: file.type || 'application/octet-stream', ...(parentFolders.length > 0 ? { parents: parentFolders } : {}) }
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', file)
      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST', headers: { Authorization: 'Bearer ' + gisToken }, body: form,
      })
      const driveFile = await uploadRes.json()
      if (!driveFile.id) throw new Error('Upload gagal: ' + (driveFile.error?.message || JSON.stringify(driveFile)))
      await adminApi.uploadFile({ assignment_id: assignmentId, file_name: file.name, mime_type: file.type || 'application/octet-stream', folder_drive_id: courseDriveFolderId || '', drive_file_id: driveFile.id, drive_view_url: driveFile.webViewLink || '', file_type: fileType })
      onDone()
    } catch (e) { setError(e.message); setLoading(false) }
  }

  const inp = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', fontSize:13.5, outline:'none', boxSizing:'border-box' }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ backgroundColor:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', width:'100%', maxWidth:460, padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Upload File - {courseName}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><FiX size={18}/></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>Tipe File</label>
            <div style={{ display:'flex', gap:8 }}>
              {['soal','jawaban','referensi','lainnya'].map(t=>(
                <button key={t} onClick={()=>setFileType(t)}
                  style={{ padding:'6px 14px', borderRadius:8, border:'1px solid', borderColor:fileType===t?'var(--warning)':'var(--border)', backgroundColor:fileType===t?'var(--warning-dim)':'var(--bg-hover)', color:fileType===t?'var(--warning)':'var(--text-secondary)', fontSize:12.5, cursor:'pointer', fontWeight:fileType===t?600:400, textTransform:'capitalize' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {!gisToken ? (
            <button onClick={handleSignIn} style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', cursor:'pointer', fontSize:13.5, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="G"/> Sign in with Google
            </button>
          ) : <p style={{ fontSize:12.5, color:'#22c55e' }}>&#10003; Google Drive siap</p>}
          <div>
            <label style={{ fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>File</label>
            <div onClick={()=>inputRef.current?.click()} style={{ border:'2px dashed var(--border)', borderRadius:10, padding:'20px', textAlign:'center', cursor:'pointer', backgroundColor:'var(--bg-hover)' }}>
              {file ? <span style={{ fontSize:13 }}>{file.name} ({(file.size/1024/1024).toFixed(1)}MB)</span> : <p style={{ fontSize:13, color:'var(--text-muted)' }}>Klik untuk pilih file</p>}
            </div>
            <input ref={inputRef} type="file" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0])}/>
          </div>
          {error && <p style={{ fontSize:12.5, color:'#ef4444' }}>{error}</p>}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:13.5 }}>Batal</button>
          <button onClick={handleUpload} disabled={loading||!file} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'var(--warning)', color:'#fff', cursor:loading||!file?'not-allowed':'pointer', fontSize:13.5, fontWeight:600, opacity:loading||!file?0.6:1 }}>{loading?'Uploading...':'Upload'}</button>
        </div>
      </div>
    </div>
  )
}

/* --- Form Modal --- */
function FormModal({ title, fields, onSubmit, onClose, loading }) {
  const [form, setForm] = useState(() => { const i={}; fields.forEach(f=>{i[f.name]=f.defaultValue||''}); return i })
  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const inp = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', fontSize:13.5, outline:'none', boxSizing:'border-box' }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ backgroundColor:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', width:'100%', maxWidth:480, padding:24, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><FiX size={18}/></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {fields.map(f=>(
            <div key={f.name}>
              <label style={{ fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>{f.label}{f.required&&' *'}</label>
              {f.type==='textarea'?<textarea value={form[f.name]} onChange={e=>set(f.name,e.target.value)} rows={3} style={{...inp,resize:'vertical'}}/>
              :f.type==='select'?<select value={form[f.name]} onChange={e=>set(f.name,e.target.value)} style={inp}>{(f.options||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
              :<input type={f.type||'text'} value={form[f.name]} onChange={e=>set(f.name,e.target.value)} placeholder={f.placeholder} style={inp}/>}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:13.5 }}>Batal</button>
          <button onClick={()=>onSubmit(form)} disabled={loading} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'var(--warning)', color:'#fff', cursor:loading?'wait':'pointer', fontSize:13.5, fontWeight:600, opacity:loading?0.7:1 }}>{loading?'Menyimpan...':'Simpan'}</button>
        </div>
      </div>
    </div>
  )
}

/* --- Task Detail Inline (untuk Dashboard) --- */
function TaskDetailInline({ item, isAdmin, onStatusChange, onUpload, onReload }) {
  const { data: attachments, reload: reloadAtts } = useApi(() => api.getAssignmentAttachments(item.id), [item.id], [])
  const attList = attachments || []
  const s = item.status || 'pending'
  return (
    <div style={{ padding:'16px', backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 10px 10px' }}>
      {item.description && <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14, lineHeight:1.6 }}>{item.description}</p>}
      {/* Status */}
      <div style={{ marginBottom:14 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Status</p>
        <div style={{ display:'flex', gap:8 }}>
          {[{v:'pending',label:'Belum'},{v:'done',label:'Selesai'}].map(opt=>(
            <button key={opt.v} onClick={()=>onStatusChange&&onStatusChange(item,opt.v)}
              style={{ padding:'6px 16px', borderRadius:8, fontSize:13, fontWeight:600, border:'2px solid',
                borderColor:s===opt.v?(opt.v==='done'?'#22c55e':'var(--accent)'):'var(--border)',
                backgroundColor:s===opt.v?(opt.v==='done'?'rgba(34,197,94,0.12)':'var(--accent-dim)'):'transparent',
                color:s===opt.v?(opt.v==='done'?'#22c55e':'var(--accent)'):'var(--text-muted)',
                cursor:'pointer' }}>
              {}{opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* Files */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>File ({attList.length})</p>
          {isAdmin && <button onClick={()=>onUpload&&onUpload(item)} style={{ height:26, padding:'0 10px', borderRadius:6, background:'var(--warning-dim)', color:'var(--warning)', fontSize:12, fontWeight:600, border:'1px solid var(--warning)', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}><FiUploadCloud size={11}/> Upload</button>}
        </div>
        {attList.length===0 ? (
          <p style={{ fontSize:12.5, color:'var(--text-muted)', textAlign:'center', padding:'10px', borderRadius:8, backgroundColor:'var(--bg-hover)' }}>Belum ada file.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {attList.map(att=>(
              <div key={att.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, backgroundColor:'var(--bg-hover)', border:'1px solid var(--border)' }}>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, backgroundColor:'var(--warning-dim)', color:'var(--warning)', textTransform:'uppercase', flexShrink:0 }}>{att.file_type||'file'}</span>
                <span style={{ fontSize:12.5, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{att.drive_file_name}</span>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  {att.drive_view_url && <a href={att.drive_view_url} target="_blank" rel="noopener noreferrer" style={{ width:26,height:26,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'var(--accent-dim)',color:'var(--accent)',textDecoration:'none' }}><FiEye size={12}/></a>}
                  {isAdmin && <button onClick={async()=>{ if(confirm('Hapus?')){ await adminApi.deleteAssignmentAttachment(att.id); reloadAtts(); }}} style={{ width:26,height:26,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(239,68,68,0.1)',color:'#ef4444',border:'none',cursor:'pointer',fontSize:14 }}>&#x2715;</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* --- Dashboard View --- */
function DashboardView({ items, isAdmin, onStatusChange, onUpload, onReload }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const now = new Date()
  const total = items.length
  const done = items.filter(i=>i.status==='done').length
  const inProgress = items.filter(i=>i.status==='in_progress').length
  const overdue = items.filter(i=>i.due_date && new Date(i.due_date)<now && i.status!=='done').length
  const pending = total - done - inProgress
  const pct = total > 0 ? Math.round((done/total)*100) : 0

  const nextStatus = { pending:'done', in_progress:'done', done:'pending' }
  const statusStyle = (s, isOv) => {
    if (isOv) return { bg:'rgba(239,68,68,0.12)', color:'#ef4444', label:'Terlambat' }
    return { done:{ bg:'rgba(34,197,94,0.12)', color:'#22c55e', label:'Selesai' }, in_progress:{ bg:'rgba(251,191,36,0.12)', color:'var(--warning)', label:'Dikerjakan' }, pending:{ bg:'var(--bg-hover)', color:'var(--text-muted)', label:'Belum' } }[s] || { bg:'var(--bg-hover)', color:'var(--text-muted)', label:'Belum' }
  }

  const bars = [
    { label:'Selesai', count:done, color:'#22c55e' },

    { label:'Terlambat', count:overdue, color:'#ef4444' },
    { label:'Belum', count:Math.max(0,pending-overdue), color:'var(--bg-hover)' },
  ].filter(b=>b.count>0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Stats cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
        {[{label:'Total',value:total,color:'var(--accent)'},{label:'Selesai',value:done,color:'#22c55e'},{label:'Terlambat',value:overdue,color:'#ef4444'},{label:'Belum',value:Math.max(0,pending-overdue),color:'var(--text-muted)'}].map(s=>(
          <div key={s.label} style={{ padding:'12px 14px', borderRadius:10, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', textAlign:'center' }}>
            <p style={{ fontSize:24, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:5 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div style={{ padding:'14px 16px', borderRadius:10, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>Progress</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#22c55e' }}>{pct}% selesai</span>
          </div>
          {/* Stacked bar */}
          <div style={{ height:12, borderRadius:99, backgroundColor:'var(--bg-hover)', overflow:'hidden', display:'flex' }}>
            {bars.filter(b=>b.color!=='var(--bg-hover)').map(b=>(
              <div key={b.label} style={{ height:'100%', backgroundColor:b.color, width:(b.count/total*100)+'%', transition:'width 0.5s' }}/>
            ))}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
            {bars.map(b=>(
              <div key={b.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, backgroundColor:b.color, flexShrink:0 }}/>
                <span style={{ fontSize:11.5, color:'var(--text-muted)' }}>{b.label}: {b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List tugas */}
      <div>
        <p style={{ fontSize:11.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:10 }}>
          Klik tugas untuk detail
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[...items].sort((a,b)=>{
            const order = { overdue:0, in_progress:1, pending:2, done:3 }
            const sa = a.due_date&&new Date(a.due_date)<now&&a.status!=='done'?'overdue':a.status||'pending'
            const sb = b.due_date&&new Date(b.due_date)<now&&b.status!=='done'?'overdue':b.status||'pending'
            return (order[sa]??2)-(order[sb]??2)
          }).map(item=>{
            const isOv = item.due_date&&new Date(item.due_date)<now&&item.status!=='done'
            const s = item.status||'pending'
            const st = statusStyle(s, isOv)
            const daysLeft = item.due_date ? Math.ceil((new Date(item.due_date)-now)/(1000*60*60*24)) : null
            return (
              <div key={item.id}>
                <div onClick={()=>setSelectedItem(selectedItem?.id===item.id?null:item)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:selectedItem?.id===item.id?'10px 10px 0 0':10, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', cursor:'pointer' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13.5, fontWeight:600, color:s==='done'?'var(--text-muted)':'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textDecoration:s==='done'?'line-through':'' }}>{item.title}</p>
                    <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, color:'var(--accent)' }}>{item.courseName}</span>
                      {item.due_date && <span style={{ fontSize:12, color:isOv?'#ef4444':'var(--text-muted)' }}>
                        {isOv?'Terlambat '+Math.abs(daysLeft)+' hari':daysLeft===0?'Hari ini':daysLeft===1?'Besok':daysLeft+' hari lagi'}
                      </span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                    <span style={{ padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:600, backgroundColor:st.bg, color:st.color }}>{st.label}</span>
                    {selectedItem?.id===item.id?<FiChevronDown size={14} style={{ color:'var(--text-muted)' }}/>:<FiChevronRight size={14} style={{ color:'var(--text-muted)' }}/>}
                  </div>
                </div>
                {selectedItem?.id===item.id && (
                  <TaskDetailInline item={selectedItem} isAdmin={isAdmin}
                    onStatusChange={(it,ns)=>{onStatusChange(it,ns);setSelectedItem({...it,status:ns});}}
                    onUpload={onUpload} onReload={onReload}/>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* --- Tugas Item --- */
function TugasItem({ item, isOpen, onToggle, isAdmin, onEdit, onDelete, onReload, onUpload, onStatusChange }) {
  const typeLabel = { individual:'Individu', group:'Kelompok', quiz:'Kuis', exam:'Ujian' }
  const now = new Date()
  const isOverdue = item.due_date && new Date(item.due_date) < now && item.status !== 'done'
  const daysLeft = item.due_date ? Math.ceil((new Date(item.due_date)-now)/(1000*60*60*24)) : null
  const s = item.status || 'pending'
  const statusColors = { done:'#22c55e', in_progress:'var(--warning)', pending:'var(--text-muted)' }
  const statusLabels = { done:'Selesai', in_progress:'Dikerjakan', pending:'Belum Dikerjakan' }
  const nextStatus = { pending:'done', in_progress:'done', done:'pending' }
  const { data: attachments, reload: reloadAtts } = useApi(() => api.getAssignmentAttachments(item.id), [item.id], [])
  const attList = attachments || []
  return (
    <div style={{ borderRadius:12, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', overflow:'hidden' }}>
      <div onClick={onToggle} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', cursor:'pointer', background:isOpen?'linear-gradient(90deg,var(--warning-dim) 0%,transparent 100%)':'none', borderBottom:isOpen?'1px solid var(--border)':'none' }}>
        <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:isOpen?'var(--warning)':'var(--warning-dim)', color:isOpen?'#fff':'var(--warning)' }}>
          <FiFileText size={16}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:600, color:s==='done'?'var(--text-muted)':'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textDecoration:s==='done'?'line-through':'' }}>{item.title}</p>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'var(--accent)', fontWeight:500 }}>{item.courseName||''}</span>
            {item.semesterName && <span style={{ fontSize:12, color:'var(--text-muted)' }}>- {item.semesterName}</span>}
            {item.assignment_type && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:99, backgroundColor:'var(--bg-hover)', color:'var(--text-muted)' }}>{typeLabel[item.assignment_type]||item.assignment_type}</span>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {item.due_date && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:isOverdue?'#ef4444':'var(--text-muted)' }}>
            <FiClock size={11}/>
            {isOverdue?'Terlambat':daysLeft===0?'Hari ini':daysLeft===1?'Besok':formatDate(item.due_date)}
          </div>}
          {isAdmin && (
            <div onClick={e=>e.stopPropagation()}>
              <AdminActions small onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item)}
                isPublished={item.is_published==='true'}
                onTogglePublish={async()=>{ await adminApi.updateAssignment(item.id,{is_published:item.is_published==='true'?'false':'true'}); onReload&&onReload(); }}
              />
            </div>
          )}
          {isOpen?<FiChevronDown size={15} style={{ color:'var(--text-muted)' }}/>:<FiChevronRight size={15} style={{ color:'var(--text-muted)' }}/>}
        </div>
      </div>
      {isOpen && (
        <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
          {item.description && <p style={{ fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.7 }}>{item.description}</p>}
          {/* Status stepper - hanya admin */}
          {isAdmin && <div style={{ padding:'12px 14px', borderRadius:10, backgroundColor:'var(--bg-hover)', border:'1px solid var(--border)' }}>
            <p style={{ fontSize:11.5, fontWeight:600, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.04em' }}>Status Pengerjaan</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[{v:'pending',label:'Belum'},{v:'done',label:'Selesai'}].map((opt,i)=>(
                <button key={opt.v} onClick={()=>onStatusChange&&onStatusChange(item,opt.v)}
                  style={{ padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, border:'2px solid',
                    borderColor:s===opt.v?(opt.v==='done'?'#22c55e':opt.v==='in_progress'?'var(--warning)':'var(--accent)'):'var(--border)',
                    backgroundColor:s===opt.v?(opt.v==='done'?'rgba(34,197,94,0.12)':opt.v==='in_progress'?'rgba(251,191,36,0.12)':'var(--accent-dim)'):'transparent',
                    color:s===opt.v?(opt.v==='done'?'#22c55e':opt.v==='in_progress'?'var(--warning)':'var(--accent)'):'var(--text-muted)',
                    cursor:'pointer' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>}

          {/* File attachments */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>File Tugas ({attList.length})</p>
              {isAdmin && (
                <button onClick={()=>onUpload&&onUpload(item)} style={{ height:28, padding:'0 12px', borderRadius:7, background:'var(--warning-dim)', color:'var(--warning)', fontSize:12, fontWeight:600, border:'1px solid var(--warning)', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <FiUploadCloud size={12}/> Upload
                </button>
              )}
            </div>
            {attList.length===0?(
              <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'12px', borderRadius:8, backgroundColor:'var(--bg-hover)' }}>Belum ada file. {isAdmin?'Klik Upload untuk tambah.':''}</p>
            ):(
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {attList.map(att=>(
                  <div key={att.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, backgroundColor:'var(--bg-hover)', border:'1px solid var(--border)' }}>
                    {(() => {
                      const t = att.file_type || 'lainnya'
                      const styles = {
                        soal: { bg:'rgba(99,102,241,0.15)', color:'#818cf8' },
                        jawaban: { bg:'rgba(34,197,94,0.15)', color:'#22c55e' },
                        referensi: { bg:'rgba(59,130,246,0.15)', color:'#60a5fa' },
                        lainnya: { bg:'var(--warning-dim)', color:'var(--warning)' },
                      }
                      const st = styles[t] || styles.lainnya
                      return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, backgroundColor:st.bg, color:st.color, textTransform:'uppercase', flexShrink:0 }}>{t}</span>
                    })()}
                    <span style={{ fontSize:13, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{att.drive_file_name}</span>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      {att.drive_view_url && <a href={att.drive_view_url} target="_blank" rel="noopener noreferrer" style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'var(--accent-dim)', color:'var(--accent)', textDecoration:'none' }}><FiEye size={13}/></a>}
                      {isAdmin && <button onClick={async()=>{ if(confirm('Hapus file ini?')){ await adminApi.deleteAssignmentAttachment(att.id); reloadAtts(); }}} style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', cursor:'pointer', fontSize:16 }}>&#x2715;</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* --- Main Page --- */
export default function Tugas() {
  const { isAdmin } = useAuth()
  const [openItems, setOpenItems] = useState({})
  const [modal, setModal] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterSem, setFilterSem] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [viewMode, setViewMode] = useState('list')

  const { data: assignments, reload } = useApi(() => isAdmin ? adminApi.getAssignments() : api.getAssignments(), [isAdmin], [])
  const { data: courses }             = useApi(() => isAdmin ? adminApi.getCourses() : api.getCourses(), [isAdmin], [])
  const { data: semesters }           = useApi(() => isAdmin ? adminApi.getSemesters() : api.getSemesters(), [isAdmin], [])
  // attachments di-fetch per TugasItem, bukan di sini

  const assignmentList = (assignments||[]).filter(a=>!a.deleted_at)
  const courseList = courses||[]
  const semList = (semesters||[]).sort((a,b)=>Number(a.order_index||0)-Number(b.order_index||0))

  const allItems = useMemo(() => assignmentList.map(a => {
    const course = courseList.find(c=>c.id===a.course_id)||{}
    const sem = semList.find(s=>s.id===course.semester_id)||{}
    return { ...a, courseName:course.name||'', semesterName:sem.name||'', courseDriveFolderId:course.drive_folder_id||'' }
  }), [assignmentList, courseList, semList])

  const visibleItems = useMemo(() => allItems.filter(i=>{
    const c = courseList.find(c=>c.id===i.course_id)
    if (filterSem && c?.semester_id !== filterSem) return false
    if (filterCourse && i.course_id !== filterCourse) return false
    return true
  }), [allItems, filterSem, filterCourse, courseList])

  const grouped = useMemo(() => {
    const r={}
    visibleItems.forEach(item => {
      const s=item.semesterName||'Tanpa Semester'
      if(!r[s]) r[s]=[]
      r[s].push(item)
    })
    return r
  }, [visibleItems])

  async function handleStatusChange(item, newStatus) {
    try { await adminApi.updateAssignment(item.id, { status: newStatus }); reload() }
    catch(e) { alert('Error: '+e.message) }
  }

  async function handleSubmit(form) {
    setSaving(true)
    try {
      if (!form.course_id) throw new Error('Pilih mata kuliah terlebih dahulu')
      if (!form.title?.trim()) throw new Error('Judul tugas diperlukan')
      if (modal.data?.id) await adminApi.updateAssignment(modal.data.id, form)
      else await adminApi.createAssignment(form)
      reload(); setModal(null)
    } catch(e) { alert('Error: '+e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try { await adminApi.deleteAssignment(deleteTarget.id); reload() } catch(e) { alert('Error: '+e.message) }
    setDeleteTarget(null)
  }

  const tugasFields = (data) => [
    { name:'course_id', label:'Mata Kuliah', type:'select', required:true, options:[{value:'',label:'-- Pilih Mata Kuliah --'},...courseList.map(c=>({value:c.id,label:(c.code?c.code+' - ':'')+c.name}))], defaultValue:data?.course_id||'' },
    { name:'title', label:'Judul Tugas', required:true, placeholder:'Tugas 1', defaultValue:data?.title||'' },
    { name:'description', label:'Deskripsi', type:'textarea', defaultValue:data?.description||'' },
    { name:'due_date', label:'Deadline', type:'date', defaultValue:data?.due_date||'' },
    { name:'assignment_type', label:'Tipe', type:'select', defaultValue:data?.assignment_type||'individual', options:[{value:'individual',label:'Individu'},{value:'group',label:'Kelompok'},{value:'quiz',label:'Kuis'},{value:'exam',label:'Ujian'}] },
  ]

  const hasFilter = filterSem || filterCourse

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.625rem', fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Tugas Kuliah</h1>
          <p style={{ fontSize:14.5, color:'var(--text-secondary)' }}>{allItems.length} tugas</p>
        </div>
        {isAdmin && <AdminAddButton label="Tambah Tugas" onClick={()=>setModal({type:'tugas'})}/>}
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11.5, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Semester</label>
          <select value={filterSem} onChange={e=>{setFilterSem(e.target.value);setFilterCourse('');}}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-card)', color:'var(--text-primary)', fontSize:13.5, outline:'none', cursor:'pointer', minWidth:160 }}>
            <option value="">Semua Semester</option>
            {semList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11.5, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Mata Kuliah</label>
          <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-card)', color:'var(--text-primary)', fontSize:13.5, outline:'none', cursor:'pointer', minWidth:180 }}>
            <option value="">Semua Mata Kuliah</option>
            {(filterSem?courseList.filter(c=>c.semester_id===filterSem):courseList).map(c=><option key={c.id} value={c.id}>{c.code?c.code+' - '+c.name:c.name}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <label style={{ fontSize:11.5, color:'transparent' }}>x</label>
          <button onClick={()=>setViewMode(v=>v==='dashboard'?'list':'dashboard')}
            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid', borderColor:viewMode==='dashboard'?'var(--warning)':'var(--border)', backgroundColor:viewMode==='dashboard'?'var(--warning-dim)':'var(--bg-card)', color:viewMode==='dashboard'?'var(--warning)':'var(--text-secondary)', fontSize:13.5, cursor:'pointer', fontWeight:viewMode==='dashboard'?600:400 }}>
            Dashboard
          </button>
        </div>
        {hasFilter && (
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:11.5, color:'transparent' }}>x</label>
            <button onClick={()=>{setFilterSem('');setFilterCourse('');}}
              style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', fontSize:13.5, cursor:'pointer' }}>
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Views */}
      {viewMode==='dashboard' && <DashboardView items={visibleItems} isAdmin={isAdmin} onStatusChange={handleStatusChange} onUpload={i=>setUploadModal({...i,uploadFolderId:i.drive_folder_id||i.courseDriveFolderId})} onReload={reload}/>}

      {viewMode==='deadline' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {[
            { key:'overdue', label:'Terlambat', color:'#ef4444', items:visibleItems.filter(i=>i.due_date&&new Date(i.due_date)<new Date()&&i.status!=='done').sort((a,b)=>new Date(a.due_date)-new Date(b.due_date)) },
            { key:'upcoming', label:'Akan Datang', color:'var(--warning)', items:visibleItems.filter(i=>i.due_date&&new Date(i.due_date)>=new Date()&&i.status!=='done').sort((a,b)=>new Date(a.due_date)-new Date(b.due_date)) },
            { key:'done', label:'Selesai', color:'#22c55e', items:visibleItems.filter(i=>i.status==='done') },
            { key:'nodl', label:'Tanpa Deadline', color:'var(--text-muted)', items:visibleItems.filter(i=>!i.due_date&&i.status!=='done') },
          ].filter(g=>g.items.length>0).map(g=>(
            <div key={g.key}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:4, height:20, borderRadius:99, backgroundColor:g.color }}/>
                <h3 style={{ fontSize:14, fontWeight:700, color:g.color }}>{g.label} ({g.items.length})</h3>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {g.items.map(item=>(
                  <TugasItem key={item.id} item={item}
                    isOpen={!!openItems[item.id]} onToggle={()=>setOpenItems(p=>({...p,[item.id]:!p[item.id]}))}
                    isAdmin={isAdmin} onEdit={i=>setModal({type:'tugas',data:i})} onDelete={setDeleteTarget}
                    onReload={reload} onUpload={i=>setUploadModal({...i,uploadFolderId:i.drive_folder_id||i.courseDriveFolderId})}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
          {visibleItems.length===0 && <div style={{ padding:'40px', textAlign:'center', borderRadius:12, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}><p style={{ color:'var(--text-muted)' }}>Tidak ada tugas.</p></div>}
        </div>
      )}

      {viewMode==='list' && (
        Object.keys(grouped).length===0?(
          <div style={{ padding:'60px 24px', textAlign:'center', borderRadius:14, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>Belum ada tugas</p>
            <p style={{ fontSize:13.5, color:'var(--text-secondary)' }}>{isAdmin?'Klik "Tambah Tugas" untuk mulai.':'Tugas akan ditampilkan di sini.'}</p>
          </div>
        ):(
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {Object.entries(grouped).map(([semName,items])=>(
              <div key={semName}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:4, height:22, borderRadius:99, backgroundColor:'var(--warning)', flexShrink:0 }}/>
                  <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{semName}</h2>
                  <span style={{ fontSize:12, color:'var(--text-muted)', backgroundColor:'var(--bg-hover)', padding:'2px 10px', borderRadius:99 }}>{items.length} tugas</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {items.map(item=>(
                    <TugasItem key={item.id} item={item}
                      isOpen={!!openItems[item.id]} onToggle={()=>setOpenItems(p=>({...p,[item.id]:!p[item.id]}))}
                      isAdmin={isAdmin} onEdit={i=>setModal({type:'tugas',data:i})} onDelete={setDeleteTarget}
                      onReload={reload} onUpload={i=>setUploadModal({...i,uploadFolderId:i.drive_folder_id||i.courseDriveFolderId})}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {uploadModal && (
        <UploadModal assignmentId={uploadModal.id} courseName={uploadModal.courseName}
          courseDriveFolderId={uploadModal.uploadFolderId||uploadModal.courseDriveFolderId}
          onClose={()=>setUploadModal(null)} onDone={()=>{setUploadModal(null);reload()}}/>
      )}

      {modal && (
        <FormModal title={modal.data?'Edit Tugas':'Tambah Tugas'} fields={tugasFields(modal.data)}
          onSubmit={handleSubmit} onClose={()=>setModal(null)} loading={saving}/>
      )}

      <AdminDeleteModal open={!!deleteTarget} title="Hapus Tugas" description={deleteTarget?'Hapus "'+deleteTarget.title+'"?':''} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}/>
    </div>
  )
}
