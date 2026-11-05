import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiUpload } from 'react-icons/fi'

/**
 * AdminAddButton — tombol '+ Tambah X' di header halaman
 */
export function AdminAddButton({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex',alignItems:'center',gap:7,height:38,padding:'0 14px',borderRadius:10,background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)',color:'#fff',fontSize:13.5,fontWeight:600,border:'none',cursor:'pointer',boxShadow:'0 3px 10px var(--accent-glow)',flexShrink:0,whiteSpace:'nowrap' }}>
      <FiPlus size={15}/>
      {label}
    </button>
  )
}

/**
 * AdminActions — tombol edit/hapus/publikasi yang muncul di setiap item
 */
export function AdminActions({ onEdit, onDelete, onTogglePublish, isPublished, small = false }) {
  const sz = small ? 12 : 13
  const h  = small ? 28 : 32
  const w  = small ? 28 : 32
  const r  = small ? 7  : 8
  const base = { height:h,width:w,borderRadius:r,display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer',flexShrink:0,transition:'all 0.15s' }
  return (
    <div style={{ display:'flex',gap:4,flexShrink:0 }}
      onClick={e => e.stopPropagation()}>
      {onTogglePublish && (
        <button onClick={onTogglePublish} title={isPublished ? 'Sembunyikan' : 'Publikasikan'}
          style={{ ...base,backgroundColor: isPublished ? 'var(--success-dim)' : 'var(--bg-hover)',color: isPublished ? 'var(--success)' : 'var(--text-muted)' }}>
          {isPublished ? <FiEye size={sz}/> : <FiEyeOff size={sz}/>}
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} title="Edit"
          style={{ ...base,backgroundColor:'var(--accent-dim)',color:'var(--accent)' }}>
          <FiEdit2 size={sz}/>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} title="Hapus"
          style={{ ...base,backgroundColor:'var(--danger-dim)',color:'var(--danger)' }}>
          <FiTrash2 size={sz}/>
        </button>
      )}
    </div>
  )
}

/**
 * AdminUploadButton — tombol upload lampiran
 */
export function AdminUploadButton({ onClick, label = 'Upload Lampiran' }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex',alignItems:'center',gap:6,height:32,padding:'0 12px',borderRadius:8,backgroundColor:'var(--bg-hover)',color:'var(--text-secondary)',fontSize:12.5,fontWeight:500,border:'1px solid var(--border)',cursor:'pointer',whiteSpace:'nowrap' }}>
      <FiUpload size={13}/>
      {label}
    </button>
  )
}

/**
 * AdminDeleteModal — modal konfirmasi hapus yang bisa digunakan di mana saja
 */
export function AdminDeleteModal({ open, title, description, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backgroundColor:'rgba(0,0,0,0.65)' }}
      onClick={e => { if(e.target===e.currentTarget) onCancel() }}>
      <div style={{ width:'100%',maxWidth:400,borderRadius:18,backgroundColor:'var(--bg-card)',border:'1px solid var(--border-strong)',padding:'24px',boxShadow:'var(--shadow-lg)',animation:'fadeInScale 0.22s cubic-bezier(0.4,0,0.2,1) both' }}>
        <h3 style={{ fontSize:16,fontWeight:700,color:'var(--text-primary)',marginBottom:10 }}>{title || 'Hapus Item'}</h3>
        <p style={{ fontSize:14,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:22 }}>
          {description || 'Yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.'}
        </p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onConfirm}
            style={{ flex:1,height:42,borderRadius:10,backgroundColor:'var(--danger)',color:'#fff',fontSize:14,fontWeight:600,border:'none',cursor:'pointer' }}>
            Ya, Hapus
          </button>
          <button onClick={onCancel}
            style={{ flex:1,height:42,borderRadius:10,backgroundColor:'var(--bg-hover)',color:'var(--text-primary)',fontSize:14,border:'none',cursor:'pointer' }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}