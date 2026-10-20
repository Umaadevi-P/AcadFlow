import { useState } from "react"
import { useAuth } from "../lib/auth"
import { Icon, navigate } from "../lib/ui"

// Demo accounts shown as quick-fill buttons on the login screen.
const DEMO_ACCOUNTS = [
  { label: "Student", email: "umaadevi@university.edu", sub: "CSE · 3rd Year" },
  { label: "Staff", email: "staff@university.edu", sub: "Academic Office" },
  { label: "Admin", email: "admin@university.edu", sub: "Administrator" },
]

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate(redirect)
    } catch (err: any) {
      setError(err?.message || "Could not sign in. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  function quickFill(accountEmail: string) {
    setEmail(accountEmail)
    setPassword("password123")
    setError("")
  }

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          <strong>AcaFlow<span className="brand-period">.</span></strong>
        </div>

        <div className="eyebrow">ACADEMIC DOCUMENT WORKFLOW</div>
        <h1>Welcome back.</h1>
        <p className="auth-sub">
          Sign in to request, track and receive your academic documents.
        </p>

        {error && (
          <div className="auth-error" role="alert">
            <Icon name="alert" size={17} /> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
            required
          />
          <button
            className="primary-button auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
            {!busy && <Icon name="arrow" size={18} />}
          </button>
        </form>

        <div className="auth-demo">
          <span className="eyebrow">DEMO ACCOUNTS · PASSWORD: password123</span>
          <div className="auth-demo-grid">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                type="button"
                key={a.email}
                className="auth-demo-card"
                onClick={() => quickFill(a.email)}
              >
                <strong>{a.label}</strong>
                <small>{a.email}</small>
                <span className="auth-demo-sub">{a.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="auth-note">
          <Icon name="lock" size={15} /> Prototype authentication for
          demonstration — not connected to a real university identity system.
        </p>
      </div>
    </main>
  )
}
