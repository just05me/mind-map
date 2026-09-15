import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
} from './api'

export type AuthStatus = 'loading' | 'guest' | 'ready'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchCurrentUser().then((next) => {
      if (cancelled) return
      if (next) {
        setUser(next)
        setStatus('ready')
        return
      }
      setUser(null)
      setStatus('guest')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const next = await loginUser(email, password)
    setUser(next)
    setStatus('ready')
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const next = await registerUser(email, password)
    setUser(next)
    setStatus('ready')
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
      setStatus('guest')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      register,
      logout,
    }),
    [status, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth должен вызываться внутри AuthProvider')
  }
  return ctx
}
