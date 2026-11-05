import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FiHome, FiBook, FiFileText, FiEdit3, FiBookOpen, FiSearch, FiMenu, FiX,
  FiSun, FiMoon, FiLock, FiChevronDown, FiChevronRight,
  FiBarChart2, FiTarget, FiCalendar, FiAward, FiPieChart, FiTrendingUp,
  FiActivity, FiBookmark, FiLogOut, FiShield,
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const mainNav = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/materi', icon: FiBook, label: 'Materi Kuliah' },
  { to: '/tugas', icon: FiFileText, label: 'Tugas' },
  { to: '/catatan', icon: FiEdit3, label: 'Catatan' },
  { to: '/literasi', icon: FiBookOpen, label: 'Literasi' },
  { to: '/search', icon: FiSearch, label: 'Pencarian' },
]

const readingNav = [
  { to: '/reading', icon: FiBarChart2, label: 'Dashboard' },
  { to: '/reading/books', icon: FiBookmark, label: 'My Books' },
  { to: '/reading/activity', icon: FiActivity, label: 'Activity' },
  { to: '/reading/goals', icon: FiTarget, label: 'Goals' },
  { to: '/reading/calendar', icon: FiCalendar, label: 'Kalender' },
  { to: '/reading/journal', icon: FiEdit3, label: 'Journal' },
  { to: '/reading/categories', icon: FiPieChart, label: 'Kategori' },
  { to: '/reading/achievements', icon: FiAward, label: 'Achievements' },
  { to: '/reading/reports', icon: FiTrendingUp, label: 'Reports' },
]

function NavItem({ to, icon: Icon, label, exact = false }) {
  return (
    <NavLink to={to} end={exact}
      className={({ isActive }) =>
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all " + (isActive ? "font-semibold" : "font-normal")
      }
      style={({ isActive }) => ({
        color: isActive ? '#fff' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--accent)' : 'transparent',
        textDecoration: 'none',
      })}>
      <Icon size={15} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{label}</span>
    </NavLink>
  )
}

function NavSection({ title, accentColor, children, defaultOpen = false, isActive }) {
  const [open, setOpen] = useState(defaultOpen || isActive)
  useEffect(() => { if (isActive) setOpen(true) }, [isActive])
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'4px 12px 8px',fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:isActive?accentColor:'var(--text-muted)',background:'none',border:'none',cursor:'pointer' }}>
        <span>{title}</span>
        {open ? <FiChevronDown size={11}/> : <FiChevronRight size={11}/>}
      </button>
      {open && <div style={{ display:'flex',flexDirection:'column',gap:1 }}>{children}</div>}
    </div>
  )
}

function AdminBadge({ onLogout }) {
  return (
    <div style={{ margin:'0 8px 8px',padding:'10px 12px',borderRadius:10,background:'linear-gradient(135deg,color-mix(in srgb,var(--accent) 14%,transparent),color-mix(in srgb,#6366f1 14%,transparent))',border:'1px solid color-mix(in srgb,var(--accent) 22%,transparent)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ display:'flex',alignItems:'center',gap:7 }}>
          <FiShield size={13} style={{ color:'var(--accent)',flexShrink:0 }}/>
          <span style={{ fontSize:12,fontWeight:700,color:'var(--accent)',letterSpacing:'0.03em' }}>Admin Mode</span>
        </div>
        <button onClick={onLogout} title="Logout"
          style={{ display:'flex',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:7,backgroundColor:'var(--danger-dim)',color:'var(--danger)',border:'none',cursor:'pointer',flexShrink:0 }}>
          <FiLogOut size={12}/>
        </button>
      </div>
    </div>
  )
}

function SidebarInner({ theme, toggleTheme, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isReading = location.pathname.startsWith('/reading')
  const { isAdmin, logout } = useAuth()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ width:'var(--sidebar-width)',height:'100%',display:'flex',flexDirection:'column',backgroundColor:'var(--bg-secondary)',borderRight:'1px solid var(--border)' }}>
      {/* Brand */}
      <div style={{ display:'flex',alignItems:'center',gap:12,padding:'20px 18px 18px',borderBottom:'1px solid var(--border)',flexShrink:0 }}>
        <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#4f8ef7 0%,#6366f1 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:13,flexShrink:0 }}>SK</div>
        <div style={{ minWidth:0,flex:1 }}>
          <div style={{ fontWeight:700,fontSize:14.5,color:'var(--text-primary)',lineHeight:1.3 }}>SalasKuliah</div>
          <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:1 }}>Academic Hub</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',flexShrink:0,borderRadius:6 }}>
            <FiX size={16}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1,overflowY:'auto',padding:'14px 8px',display:'flex',flexDirection:'column',gap:18 }}>
        <NavSection title="Akademik" accentColor="var(--accent)" defaultOpen={!isReading} isActive={!isReading}>
          {mainNav.map(({ to, icon, label }) => <NavItem key={to} to={to} icon={icon} label={label} exact={to==='/'} />)}
        </NavSection>
        <div style={{ height:1,background:'var(--border)',margin:'0 6px' }}/>
        <NavSection title="Reading Tracker" accentColor="var(--success)" defaultOpen={isReading} isActive={isReading}>
          {readingNav.map(({ to, icon, label }) => <NavItem key={to} to={to} icon={icon} label={label} exact={to==='/reading'} />)}
        </NavSection>
      </nav>

      {/* Admin badge */}
      {isAdmin && <AdminBadge onLogout={handleLogout} />}

      {/* Footer */}
      <div style={{ borderTop:'1px solid var(--border)',padding:'8px',flexShrink:0 }}>
        {!isAdmin && <NavItem to="/admin" icon={FiLock} label="Admin Login" />}
        <button onClick={toggleTheme}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full transition-all"
          style={{ fontSize:13,color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer' }}>
          {theme==='dark' ? <FiSun size={15} style={{ flexShrink:0 }}/> : <FiMoon size={15} style={{ flexShrink:0 }}/>}
          <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            {theme==='dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children, theme, toggleTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isReading = location.pathname.startsWith('/reading')
  const { isAdmin } = useAuth()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  return (
    <div style={{ display:'flex',height:'100dvh',overflow:'hidden',backgroundColor:'var(--bg-base)' }}>
      <div className="hidden md:flex" style={{ flexShrink:0,height:'100%' }}>
        <SidebarInner theme={theme} toggleTheme={toggleTheme} />
      </div>
      {sidebarOpen && (
        <div className="md:hidden" style={{ position:'fixed',inset:0,zIndex:50,display:'flex' }} onClick={() => setSidebarOpen(false)}>
          <div style={{ position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.65)' }}/>
          <div style={{ position:'relative',zIndex:51,height:'100%' }} onClick={e => e.stopPropagation()}>
            <SidebarInner theme={theme} toggleTheme={toggleTheme} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
      <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden' }}>
        <header className="flex md:hidden"
          style={{ alignItems:'center',justifyContent:'space-between',padding:'14px 16px',flexShrink:0,backgroundColor:'var(--bg-secondary)',borderBottom:'1px solid var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color:'var(--text-primary)',background:'none',border:'none',cursor:'pointer',display:'flex' }}>
            <FiMenu size={22}/>
          </button>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontWeight:700,fontSize:15,color:'var(--text-primary)' }}>
              {isReading ? '📚 Reading' : 'SalasKuliah'}
            </span>
            {isAdmin && <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:99,backgroundColor:'var(--accent-dim)',color:'var(--accent)' }}>ADMIN</span>}
          </div>
          <button onClick={toggleTheme} style={{ color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',display:'flex' }}>
            {theme==='dark' ? <FiSun size={20}/> : <FiMoon size={20}/>}
          </button>
        </header>
        <main style={{ flex:1,overflowY:'auto',overflowX:'hidden' }}>
          <div style={{ maxWidth:1180,margin:'0 auto',padding:'36px 28px 48px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}