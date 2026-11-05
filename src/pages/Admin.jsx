import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiShield, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

export default function Admin() {
  const { isAdmin, login, logout } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // If already admin, show a simple logout page
  if (isAdmin) {
    return (
      <div style={{ minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
        <div style={{ width:'100%',maxWidth:400,animation:'fadeInScale 0.3s cubic-bezier(0.4,0,0.2,1) both' }}>
          <div style={{ textAlign:'center',marginBottom:28 }}>
            <div style={{ width:60,height:60,borderRadius:16,background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',boxShadow:'0 8px 28px var(--accent-glow)' }}>
              <FiShield size={28} style={{ color:'#fff' }}/>
            </div>
            <h1 style={{ fontSize:'1.375rem',fontWeight:800,color:'var(--text-primary)',marginBottom:6,letterSpacing:'-0.02em' }}>Kamu sudah login sebagai Admin</h1>
            <p style={{ fontSize:14,color:'var(--text-secondary)' }}>Tombol CRUD sudah aktif di semua halaman.</p>
          </div>
          <div style={{ backgroundColor:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18,padding:'24px',boxShadow:'var(--shadow-lg)',display:'flex',flexDirection:'column',gap:12 }}>
            <button onClick={() => navigate('/')}
              style={{ width:'100%',height:46,borderRadius:11,background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)',color:'#fff',fontSize:14.5,fontWeight:600,border:'none',cursor:'pointer',boxShadow:'0 4px 14px var(--accent-glow)' }}>
              Kembali ke Dashboard
            </button>
            <button onClick={() => { logout(); navigate('/') }}
              style={{ width:'100%',height:46,borderRadius:11,backgroundColor:'var(--danger-dim)',color:'var(--danger)',fontSize:14.5,fontWeight:600,border:'1px solid color-mix(in srgb,var(--danger) 25%,transparent)',cursor:'pointer' }}>
              Logout dari Admin
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const result = await login(password)
      if (result.ok) {
        navigate('/')
      } else {
        const n = attempts + 1
        setAttempts(n)
        setError(n >= 3 ? `Password salah (percobaan ke-${n}).` : 'Password salah. Coba lagi.')
      }
    } finally { setLoading(false); setPassword('') }
  }

  return (
    <div style={{ minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ width:'100%',maxWidth:420,animation:'fadeInScale 0.3s cubic-bezier(0.4,0,0.2,1) both' }}>
        {/* Brand */}
        <div style={{ textAlign:'center',marginBottom:32 }}>
          <div style={{ width:64,height:64,borderRadius:18,background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 32px var(--accent-glow)' }}>
            <FiShield size={30} style={{ color:'#fff' }}/>
          </div>
          <h1 style={{ fontSize:'1.5rem',fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.025em',marginBottom:6 }}>Admin Login</h1>
          <p style={{ fontSize:14.5,color:'var(--text-secondary)' }}>SalasKuliah Academic Hub</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:'28px 28px 24px',boxShadow:'var(--shadow-lg)' }}>
          <form onSubmit={handleLogin} style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <div>
              <label style={{ display:'block',fontSize:13,fontWeight:600,color:'var(--text-secondary)',marginBottom:8 }}>Password Admin</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Masukkan password..."
                  autoFocus
                  style={{ width:'100%',height:48,paddingLeft:16,paddingRight:46,borderRadius:12,fontSize:15,color:'var(--text-primary)',backgroundColor:'var(--bg-card-alt)',border:`1.5px solid `,outline:'none',fontFamily:'inherit',boxShadow:password&&!error?'0 0 0 3px var(--accent-glow)':'none',transition:'border-color 0.15s,box-shadow 0.15s' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex',padding:4 }}>
                  {showPw ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
                </button>
              </div>
              {error && (
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:8,fontSize:13,color:'var(--danger)' }}>
                  <FiAlertCircle size={13}/> {error}
                </div>
              )}
            </div>
            <button type="submit" disabled={loading||!password}
              style={{ width:'100%',height:48,borderRadius:12,background:loading||!password?'var(--bg-hover)':'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)',color:loading||!password?'var(--text-muted)':'#fff',fontSize:15,fontWeight:600,border:'none',cursor:loading||!password?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:!loading&&password?'0 4px 16px var(--accent-glow)':'none',transition:'all 0.2s' }}>
              {loading ? 'Memverifikasi...' : <><FiShield size={16}/> Masuk sebagai Admin</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center',fontSize:12.5,color:'var(--text-muted)',marginTop:20 }}>
          Bukan admin?{' '}
          <a href="/" style={{ color:'var(--accent)',textDecoration:'none',fontWeight:500 }}>Kembali ke beranda</a>
        </p>
      </div>
    </div>
  )
}