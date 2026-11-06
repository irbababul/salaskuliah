import { useState, useMemo, useRef, useEffect } from 'react'
import { FiBook, FiChevronDown, FiChevronRight, FiX, FiUploadCloud, FiFile, FiEye } from 'react-icons/fi'
import { AdminAddButton, AdminActions, AdminDeleteModal } from '../components/AdminToolbar'
import { useAuth } from '../contexts/AuthContext'
import { useApi } from '../hooks/useApi'
import { adminApi, api } from '../utils/api'

function UploadModal({ courseId, courseName, courseDriveFolderId, onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
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
    // Auto-request token jika belum ada (silent jika sudah login sebelumnya)
    if (window._cachedDriveToken) {
      setGisToken(window._cachedDriveToken)
    } else {
      try { tokenClient.requestAccessToken({ prompt: '' }) } catch(e) { /* butuh interaksi user */ }
    }
  }, [])

  function handleSignIn() { if (window._driveTokenClient) window._driveTokenClient.requestAccessToken({ prompt: 'none', hint: 'iirsalas9@gmail.com' }) }

  async function handleUpload() {
    if (!file) return setError('Pilih file dulu')
    if (!title.trim()) return setError('Judul diperlukan')
    if (!gisToken) return setError('Silakan login Google terlebih dahulu')
    setLoading(true); setError('')
    try {
      const matRes = await adminApi.createMaterial({ course_id: courseId, title: title.trim(), is_published: 'true' })
      const matId = matRes.data?.id
      if (!matId) throw new Error('Gagal buat record materi')
      const parentFolders = courseDriveFolderId ? [courseDriveFolderId] : []
      const metadata = { name: file.name, mimeType: file.type || 'application/octet-stream', ...(parentFolders.length > 0 ? { parents: parentFolders } : {}) }
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', file)
      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST', headers: { Authorization: 'Bearer ' + gisToken }, body: form,
      })
      const driveFile = await uploadRes.json()
      if (!driveFile.id) throw new Error('Upload gagal: ' + (driveFile.error?.message || JSON.stringify(driveFile)))
      await adminApi.uploadFile({ material_id: matId, file_name: file.name, mime_type: file.type || 'application/octet-stream', folder_drive_id: courseDriveFolderId || '', drive_file_id: driveFile.id, drive_view_url: driveFile.webViewLink || '' })
      onDone()
    } catch (e) { setError(e.message); setLoading(false) }
  }

  const inp = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', fontSize:13.5, outline:'none', boxSizing:'border-box' }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ backgroundColor:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', width:'100%', maxWidth:460, padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Upload Materi</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><FiX size={18}/></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={{ fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>Judul *</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Pertemuan 1" style={inp}/></div>
          {!gisToken ? (
            <button onClick={handleSignIn} style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-primary)', cursor:'pointer', fontSize:13.5, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="G"/> Sign in with Google
            </button>
          ) : <p style={{ fontSize:12.5, color:'#22c55e' }}>&#10003; Google Drive siap</p>}
          <div>
            <label style={{ fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', marginBottom:5, display:'block' }}>File</label>
            <div onClick={()=>inputRef.current?.click()} style={{ border:'2px dashed var(--border)', borderRadius:10, padding:'20px', textAlign:'center', cursor:'pointer', backgroundColor:'var(--bg-hover)' }}>
              {file ? <span style={{ fontSize:13, color:'var(--text-primary)' }}>{file.name} ({(file.size/1024/1024).toFixed(1)}MB)</span> : <p style={{ fontSize:13, color:'var(--text-muted)' }}>Klik untuk pilih file</p>}
            </div>
            <input ref={inputRef} type="file" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0])}/>
          </div>
          {error && <p style={{ fontSize:12.5, color:'#ef4444' }}>{error}</p>}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:13.5 }}>Batal</button>
          <button onClick={handleUpload} disabled={loading||!file} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:loading||!file?'not-allowed':'pointer', fontSize:13.5, fontWeight:600, opacity:loading||!file?0.6:1 }}>{loading?'Uploading...':'Upload'}</button>
        </div>
      </div>
    </div>
  )
}

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
          <button onClick={()=>onSubmit(form)} disabled={loading} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:loading?'wait':'pointer', fontSize:13.5, fontWeight:600, opacity:loading?0.7:1 }}>{loading?'Menyimpan...':'Simpan'}</button>
        </div>
      </div>
    </div>
  )
}

function MaterialCard({ item, isAdmin, onEdit, onDelete, onTogglePublish }) {
  const url = item.drive_view_url || ''
  const ext = item.mime_type && item.mime_type.includes('pdf') ? 'PDF' : item.mime_type && item.mime_type.includes('video') ? 'VID' : item.mime_type && item.mime_type.includes('word') ? 'DOC' : item.mime_type && item.mime_type.includes('presentation') ? 'PPT' : 'FILE'
  return (
    <div style={{ padding:'12px 14px', borderRadius:10, backgroundColor:'var(--bg-hover)', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:11, fontWeight:700, padding:'3px 7px', borderRadius:6, backgroundColor:'var(--accent-dim)', color:'var(--accent)', flexShrink:0 }}>{ext}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</p>
        {item.tags && <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>{item.tags.split(',').filter(Boolean).map(t=><span key={t} style={{ fontSize:11, padding:'1px 7px', borderRadius:99, backgroundColor:'var(--accent-dim)', color:'var(--accent-light)' }}>{t.trim()}</span>)}</div>}
      </div>
      <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ width:30, height:30, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'var(--accent-dim)', color:'var(--accent)', textDecoration:'none' }} title="Lihat file"><FiEye size={13}/></a>}
        {isAdmin && <AdminActions small onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item)} isPublished={item.is_published==='true'} onTogglePublish={onTogglePublish}/>}
      </div>
    </div>
  )
}

function CourseAccordion({ course, materials, isOpen, onToggle, isAdmin, onUpload, onEdit, onDelete, onEditMaterial, onDeleteMaterial, onToggleMaterial }) {
  return (
    <div style={{ borderRadius:12, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', overflow:'hidden' }}>
      <div onClick={onToggle} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 18px', cursor:'pointer', textAlign:'left', background:isOpen?'linear-gradient(90deg,var(--accent-dim) 0%,transparent 100%)':'none', borderBottom:isOpen?'1px solid var(--border)':'none' }}>
        <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:isOpen?'var(--accent)':'var(--accent-dim)', color:isOpen?'#fff':'var(--accent)' }}><FiBook size={16}/></div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{course.name}</p>
          <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{materials.length} materi{course.lecturer ? ' - ' + course.lecturer : ''}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {isAdmin && isOpen && <button onClick={e=>{e.stopPropagation();onUpload(course)}} style={{ height:28, padding:'0 10px', borderRadius:7, background:'var(--accent)', color:'#fff', fontSize:12, fontWeight:600, border:'none', cursor:'pointer' }}>Upload</button>}
          {isAdmin && !isOpen && <div onClick={e=>e.stopPropagation()}><AdminActions small onEdit={()=>onEdit(course)} onDelete={()=>onDelete(course)}/></div>}
          {isOpen?<FiChevronDown size={16} style={{ color:'var(--text-muted)' }}/>:<FiChevronRight size={16} style={{ color:'var(--text-muted)' }}/>}
        </div>
      </div>
      {isOpen && (
        <div style={{ padding:'16px 18px' }}>
          {materials.length===0?<p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>{isAdmin?'Klik Upload untuk tambah materi.':'Belum ada materi.'}</p>
          :<div style={{ display:'flex', flexDirection:'column', gap:8 }}>{materials.map(m=><MaterialCard key={m.id} item={m} isAdmin={isAdmin} onEdit={()=>onEditMaterial(m)} onDelete={()=>onDeleteMaterial(m)} onTogglePublish={()=>onToggleMaterial(m)}/>)}</div>}
        </div>
      )}
    </div>
  )
}

export default function Materi() {
  const { isAdmin } = useAuth()
  const [openCourses, setOpenCourses] = useState({})
  const [modal, setModal] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterSem, setFilterSem] = useState('')
  const [filterCourse, setFilterCourse] = useState('')

  const { data: semesters, reload: reloadSems }      = useApi(() => isAdmin ? adminApi.getSemesters() : api.getSemesters(), [isAdmin], [])
  const { data: courses,   reload: reloadCourses }   = useApi(() => isAdmin ? adminApi.getCourses() : api.getCourses(), [isAdmin], [])
  const { data: materials, reload: reloadMaterials } = useApi(() => isAdmin ? adminApi.getMaterials() : api.getMaterials(), [isAdmin], [])

  const semList    = (semesters||[]).sort((a,b)=>Number(a.order_index||0)-Number(b.order_index||0))
  const courseList = courses||[]
  const matList    = materials||[]
  const visibleSems = filterSem?semList.filter(s=>s.id===filterSem):semList
  const toggle = key => setOpenCourses(p=>({...p,[key]:!p[key]}))

  async function handleSubmit(form) {
    setSaving(true)
    try {
      if (modal.type==='semester') { if(modal.data?.id) await adminApi.updateSemester(modal.data.id,form); else await adminApi.createSemester(form); reloadSems() }
      else if (modal.type==='course') { const sid=form.semester_id||modal.semesterId; if(modal.data?.id) await adminApi.updateCourse(modal.data.id,{...form,semester_id:sid}); else await adminApi.createCourse({...form,semester_id:sid}); reloadCourses() }
      else if (modal.type==='material') { if(modal.data?.id) await adminApi.updateMaterial(modal.data.id,form); else await adminApi.createMaterial({...form,course_id:modal.courseId}); reloadMaterials() }
      setModal(null)
    } catch(e) { alert('Error: '+e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget._type==='course') await adminApi.deleteCourse(deleteTarget.id)
      else if (deleteTarget._type==='material') await adminApi.deleteMaterial(deleteTarget.id)
      else if (deleteTarget._type==='semester') await adminApi.deleteSemester(deleteTarget.id)
      reloadSems(); reloadCourses(); reloadMaterials()
    } catch(e) { alert('Error: '+e.message) }
    setDeleteTarget(null)
  }

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:28 }}>
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.625rem', fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Materi Kuliah</h1>
          <p style={{ fontSize:14.5, color:'var(--text-secondary)' }}>{semList.length} semester | {courseList.length} matkul | {matList.filter(m=>!m.deleted_at).length} materi</p>
        </div>
        {isAdmin && <AdminAddButton label="Tambah Semester" onClick={()=>setModal({type:'semester'})}/>}
      </div>

      {semList.length > 0 && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Semester</label>
            <select value={filterSem} onChange={e=>{setFilterSem(e.target.value); setFilterCourse('')}}
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
              {(filterSem ? courseList.filter(c=>c.semester_id===filterSem) : courseList).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {semList.length===0?(
        <div style={{ padding:'60px 24px', textAlign:'center', borderRadius:14, backgroundColor:'var(--bg-card)', border:'1px solid var(--border)' }}>
          <p style={{ fontSize:36, marginBottom:12 }}>??</p>
          <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>Belum ada semester</p>
          <p style={{ fontSize:13.5, color:'var(--text-secondary)' }}>{isAdmin?'Klik "Tambah Semester" untuk mulai.':'Konten akan segera tersedia.'}</p>
        </div>
      ):(
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          {visibleSems.filter(sem => !filterCourse || courseList.some(c=>c.semester_id===sem.id && c.id===filterCourse)).map(sem=>{
            const semCourses=courseList.filter(c=>c.semester_id===sem.id && (!filterCourse || c.id===filterCourse))
            return (
              <div key={sem.id}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:4, height:22, borderRadius:99, backgroundColor:'var(--accent)', flexShrink:0 }}/>
                    <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{sem.name}</h2>
                    <span style={{ fontSize:12, color:'var(--text-muted)', backgroundColor:'var(--bg-hover)', padding:'2px 10px', borderRadius:99 }}>{semCourses.length} matkul</span>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {isAdmin && <button onClick={()=>setModal({type:'course',semesterId:sem.id})} style={{ height:30, padding:'0 12px', borderRadius:8, background:'var(--accent-dim)', color:'var(--accent)', fontSize:12.5, fontWeight:600, border:'1px solid var(--accent)', cursor:'pointer' }}>+ Matkul</button>}
                    {isAdmin && <AdminActions small onEdit={()=>setModal({type:'semester',data:sem})} onDelete={()=>setDeleteTarget({...sem,_type:'semester'})}/>}
                  </div>
                </div>
                {semCourses.length===0?(
                  <div style={{ padding:'18px', borderRadius:10, backgroundColor:'var(--bg-card)', border:'1px dashed var(--border)', textAlign:'center' }}>
                    <p style={{ fontSize:13, color:'var(--text-muted)' }}>{isAdmin?'Klik "Matkul" untuk tambah mata kuliah.':'Belum ada mata kuliah.'}</p>
                  </div>
                ):(
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {semCourses.map(course=>{
                      const key=sem.id+'::'+course.id
                      const courseMats=matList.filter(m=>m.course_id===course.id&&!m.deleted_at)
                      return (
                        <CourseAccordion key={course.id} course={course} materials={courseMats}
                          isOpen={!!openCourses[key]} onToggle={()=>toggle(key)} isAdmin={isAdmin}
                          onUpload={()=>setUploadModal(course)}
                          onEdit={()=>setModal({type:'course',data:course,semesterId:sem.id})}
                          onDelete={()=>setDeleteTarget({...course,_type:'course'})}
                          onEditMaterial={m=>setModal({type:'material',data:m,courseId:m.course_id})}
                          onDeleteMaterial={m=>setDeleteTarget({...m,_type:'material'})}
                          onToggleMaterial={async m=>{await adminApi.updateMaterial(m.id,{is_published:m.is_published==='true'?'false':'true'});reloadMaterials();}}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {uploadModal && <UploadModal courseId={uploadModal.id} courseName={uploadModal.name} courseDriveFolderId={uploadModal.drive_folder_id} onClose={()=>setUploadModal(null)} onDone={()=>{setUploadModal(null);reloadMaterials()}}/>}
      {modal?.type==='semester' && <FormModal title={modal.data?'Edit Semester':'Tambah Semester'} fields={[{name:'name',label:'Nama Semester',placeholder:'Semester 7',required:true,defaultValue:modal.data?.name||''},{name:'academic_year',label:'Tahun Akademik',placeholder:'2025/2026',defaultValue:modal.data?.academic_year||''},{name:'order_index',label:'Urutan',type:'number',defaultValue:modal.data?.order_index||''}]} onSubmit={handleSubmit} onClose={()=>setModal(null)} loading={saving}/>}
      {modal?.type==='course' && <FormModal title={modal.data?'Edit Mata Kuliah':'Tambah Mata Kuliah'} fields={[{name:'semester_id',label:'Semester',type:'select',options:semList.map(s=>({value:s.id,label:s.name})),defaultValue:modal.data?.semester_id||modal.semesterId||semList[0]?.id||''},{name:'name',label:'Nama Mata Kuliah',required:true,defaultValue:modal.data?.name||''},{name:'code',label:'Kode MK',placeholder:'MAT101',defaultValue:modal.data?.code||''},{name:'credits',label:'SKS',type:'number',defaultValue:modal.data?.credits||'3'},{name:'lecturer',label:'Dosen',defaultValue:modal.data?.lecturer||''}]} onSubmit={handleSubmit} onClose={()=>setModal(null)} loading={saving}/>}
      {modal?.type==='material' && <FormModal title={modal.data?'Edit Materi':'Tambah Materi'} fields={[{name:'title',label:'Judul',required:true,defaultValue:modal.data?.title||''},{name:'description',label:'Deskripsi',type:'textarea',defaultValue:modal.data?.description||''},{name:'tags',label:'Tags',placeholder:'pdf,slide',defaultValue:modal.data?.tags||''}]} onSubmit={handleSubmit} onClose={()=>setModal(null)} loading={saving}/>}
      <AdminDeleteModal open={!!deleteTarget} title="Hapus Item" description={deleteTarget?'Hapus "'+( deleteTarget.title||deleteTarget.name)+'"?':''} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}/>
    </div>
  )
}
