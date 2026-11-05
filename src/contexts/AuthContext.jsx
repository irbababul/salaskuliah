import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

// Fallback: SHA-256 local check (works when API is offline)
const ADMIN_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
const SESSION_KEY = 'sk_admin_session'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === 'true' } catch { return false }
  })

  // Try to verify session against real API on mount
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.isAdmin) {
          setIsAdmin(true)
          sessionStorage.setItem(SESSION_KEY, 'true')
        }
      })
      .catch(() => { /* API offline — rely on sessionStorage */ })
  }, [])

  const login = useCallback(async (password) => {
    // Try real API first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.success) {
        setIsAdmin(true)
        sessionStorage.setItem(SESSION_KEY, 'true')
        return { ok: true }
      }
      // API returned error
      if (res.status === 401) return { ok: false }
    } catch {
      // API offline — fallback to local hash check
      const hash = await sha256(password)
      if (hash === ADMIN_HASH) {
        setIsAdmin(true)
        sessionStorage.setItem(SESSION_KEY, 'true')
        return { ok: true }
      }
    }
    return { ok: false }
  }, [])

  const logout = useCallback(async () => {
    setIsAdmin(false)
    sessionStorage.removeItem(SESSION_KEY)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch { /* non-fatal */ }
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
