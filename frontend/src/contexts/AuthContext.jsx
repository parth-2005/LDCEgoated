import { createContext, useContext, useState, useEffect } from 'react'
import { tokenStore, getMe, logout as apiLogout } from '../api'

const AuthContext = createContext(null)

const BACKEND_TO_FRONTEND_ROLE = {
  DFO: 'DFO',
  STATE_ADMIN: 'STATE_ADMIN',
  AUDIT: 'AUDIT_OFFICER',
  SCHEME_VERIFIER: 'SCHEME_VERIFIER',
  USER: 'USER',
}

export const DEFAULT_PATHS = {
  DFO:             '/dfo/dashboard',
  STATE_ADMIN:     '/admin/gujarat-map',
  AUDIT_OFFICER:   '/audit/overview',
  SCHEME_VERIFIER: '/verifier/my-cases',
  USER:            '/user/dashboard',
}

export function AuthProvider({ children }) {
  const [role, setRole]       = useState(null)
  const [officer, setOfficer] = useState(null)
  const [loading, setLoading] = useState(() => !!tokenStore.get()) // true only if there's a token to validate

  // ── Restore session from localStorage on mount ────────────────────────
  useEffect(() => {
    const storedUser = tokenStore.getUser()
    const token      = tokenStore.get()

    if (token && storedUser) {
      const frontendRole = BACKEND_TO_FRONTEND_ROLE[storedUser.role] || storedUser.role
      getMe()
        .then(me => {
          if (me?.role) {
            setOfficer(storedUser)
            setRole(frontendRole)
          } else {
            tokenStore.clear()
          }
        })
        .catch(() => tokenStore.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    // Listen for token expiry (emitted by axios 401 interceptor)
    const onExpired = () => {
      setRole(null)
      setOfficer(null)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const handleLogin = (frontendRole, data) => {
    setRole(frontendRole)
    setOfficer(data || null)
  }

  const handleLogout = async () => {
    await apiLogout()
    setRole(null)
    setOfficer(null)
  }

  return (
    <AuthContext.Provider value={{ role, officer, loading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
