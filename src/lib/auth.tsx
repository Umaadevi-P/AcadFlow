// Authentication context. Stores the JWT in localStorage and exposes the current
// user plus login/logout. Listens for "acaflow:unauth" (fired by api.ts on a 401)
// so an expired token returns the user to the login screen automatically.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { AuthApi, api, getToken, type User } from "./api"

type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On first load, if a token exists, validate it by fetching /me.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    AuthApi.me()
      .then((data) => setUser(data.user))
      .catch(() => {
        api.setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // React to a 401 from any API call (token expired/invalid).
  useEffect(() => {
    const handler = () => {
      setUser(null)
      api.setToken(null)
    }
    window.addEventListener("acaflow:unauth", handler)
    return () => window.removeEventListener("acaflow:unauth", handler)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await AuthApi.login(email, password)
    api.setToken(token)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
