import { useState, useEffect, lazy, Suspense, Component } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import { SkeletonPage } from './components/Skeleton'
import { ReadingProvider } from './reading/ReadingContext'
import { AuthProvider } from './contexts/AuthContext'

/* ─── Error Boundary ─────────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            Gagal memuat halaman
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13.5 }}>
            Coba Lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const Dashboard          = lazy(() => import('./pages/Dashboard'))
const Materi             = lazy(() => import('./pages/Materi'))
const Tugas              = lazy(() => import('./pages/Tugas'))
const Catatan            = lazy(() => import('./pages/Catatan'))
const Literasi           = lazy(() => import('./pages/Literasi'))
const Search             = lazy(() => import('./pages/Search'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Admin              = lazy(() => import('./pages/Admin'))

const ReadingDashboard   = lazy(() => import('./pages/reading/ReadingDashboard'))
const MyBooks            = lazy(() => import('./pages/reading/MyBooks'))
const ReadingActivity    = lazy(() => import('./pages/reading/ReadingActivity'))
const ReadingGoals       = lazy(() => import('./pages/reading/ReadingGoals'))
const ReadingCalendar    = lazy(() => import('./pages/reading/ReadingCalendar'))
const ReadingJournal     = lazy(() => import('./pages/reading/ReadingJournal'))
const ReadingCategories  = lazy(() => import('./pages/reading/ReadingCategories'))
const ReadingAchievements = lazy(() => import('./pages/reading/ReadingAchievements'))
const ReadingReports     = lazy(() => import('./pages/reading/ReadingReports'))

function PageLoader() {
  return <div style={{ padding: '16px' }}><SkeletonPage /></div>
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ReadingProvider>
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"                      element={<Dashboard />} />
                    <Route path="/materi"                element={<Materi />} />
                    <Route path="/tugas"                 element={<Tugas />} />
                    <Route path="/catatan"               element={<Catatan />} />
                    <Route path="/literasi"              element={<Literasi />} />
                    <Route path="/search"                element={<Search />} />
                    <Route path="/jadwal" element={<Schedule />} />
                  <Route path="/admin"                 element={<Admin />} />
                    <Route path="/reading"               element={<ReadingDashboard />} />
                    <Route path="/reading/books"         element={<MyBooks />} />
                    <Route path="/reading/activity"      element={<ReadingActivity />} />
                    <Route path="/reading/goals"         element={<ReadingGoals />} />
                    <Route path="/reading/calendar"      element={<ReadingCalendar />} />
                    <Route path="/reading/journal"       element={<ReadingJournal />} />
                    <Route path="/reading/categories"    element={<ReadingCategories />} />
                    <Route path="/reading/achievements"  element={<ReadingAchievements />} />
                    <Route path="/reading/reports"       element={<ReadingReports />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ReadingProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}