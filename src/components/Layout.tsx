import { useEffect, useState } from "react"
import { useAuth } from "../lib/auth"
import { Icon, LinkButton, navigate, type IconName } from "../lib/ui"

// Build initials for the avatar badge, e.g. "Umaadevi" → "U", "Ravi Kumar" → "RK".
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function roleLabel(role: string) {
  if (role === "admin") return "Administrator · System access"
  if (role === "staff") return "Department staff · Reviewer"
  return "Verified student · Institutional account"
}

function subLabel(user: { role: string; departmentCode?: string; year?: string; department?: string }) {
  if (user.role === "student") return `${user.departmentCode || ""} · ${user.year || ""}`.trim().replace(/^·\s*|·\s*$/g, "")
  if (user.role === "staff") return user.department || "Staff"
  return "Administrator"
}

export function Header({ path }: { path: string }) {
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const pathname = path.split("?")[0]

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
    setNotificationsOpen(false)
  }, [path])

  if (!user) return null

  const links = [
    { label: "Home", to: "/" },
    { label: "Explore Documents", to: "/search" },
    { label: "My Requests", to: "/requests" },
  ]
  // Staff and administrators get an extra "Review" link to the dashboard.
  if (user.role === "staff" || user.role === "admin") {
    links.push({ label: "Review", to: "/staff" })
  }

  const isActive = (to: string) =>
    pathname === to ||
    (pathname.startsWith("/documents") && to === "/search") ||
    (pathname.startsWith("/staff") && to === "/staff")

  const isStaff = user.role === "staff" || user.role === "admin"

  return (
    <header className="site-header">
      <div className="header-inner">
        <LinkButton to="/" className="brand" aria-label="AcaFlow home">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>
            AcaFlow<span className="brand-period">.</span>
          </span>
        </LinkButton>
        <nav
          className={`main-nav ${mobileOpen ? "nav-open" : ""}`}
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <LinkButton
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? "active" : ""}`}
            >
              {link.label}
            </LinkButton>
          ))}
        </nav>
        <div className="header-actions">
          <LinkButton
            to="/search"
            className="icon-button header-search"
            aria-label="Search documents"
          >
            <Icon name="search" size={21} />
          </LinkButton>
          <div className="popover-anchor">
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen)
                setProfileOpen(false)
              }}
            >
              <Icon name="bell" size={20} />
              <span className="notification-dot" />
            </button>
            {notificationsOpen && (
              <div className="popover notification-popover">
                <div className="popover-title">Notifications</div>
                <p>
                  <span className="small-dot" />
                  {isStaff
                    ? "Requests awaiting your review appear under Review."
                    : "Updates about your documents show up in My Requests."}
                </p>
                <LinkButton
                  to={isStaff ? "/staff" : "/requests"}
                  className="popover-link"
                >
                  {isStaff ? "Open review queue" : "See your requests"}{" "}
                  <Icon name="arrow" size={15} />
                </LinkButton>
              </div>
            )}
          </div>
          <span className="header-divider" />
          <div className="popover-anchor">
            <button
              className="profile-button"
              onClick={() => {
                setProfileOpen(!profileOpen)
                setNotificationsOpen(false)
              }}
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              <span className="avatar">{initials(user.name)}</span>
              <span className="profile-copy">
                <strong>{user.name}</strong>
                <small>{subLabel(user)}</small>
              </span>
              <Icon name="chevron" size={15} className="profile-chevron" />
            </button>
            {profileOpen && (
              <div className="popover profile-popover">
                <div className="popover-title">{user.name}</div>
                <p className="profile-id">{user.email}</p>
                <div className="profile-verified">
                  <Icon name="shield" size={17} /> {roleLabel(user.role)}
                </div>
                {!isStaff && (
                  <LinkButton to="/requests" className="popover-link">
                    My requests <Icon name="arrow" size={15} />
                  </LinkButton>
                )}
                {isStaff && (
                  <LinkButton to="/staff" className="popover-link">
                    Review queue <Icon name="arrow" size={15} />
                  </LinkButton>
                )}
                <button
                  className="popover-link popover-logout"
                  onClick={() => {
                    logout()
                    navigate("/login")
                  }}
                >
                  <Icon name="logout" size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={23} />
          </button>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark small">
            <span />
            <span />
            <span />
            <span />
          </span>
          <strong>AcaFlow.</strong>
          <span>Good things take fewer forms.</span>
        </div>
        <div className="footer-links">
          <LinkButton to="/">Home</LinkButton>
          <LinkButton to="/search">Explore Documents</LinkButton>
          <LinkButton to="/requests">My Requests</LinkButton>
        </div>
        <span className="footer-copyright">
          Made for your next step · © 2026 AcaFlow
        </span>
      </div>
    </footer>
  )
}
