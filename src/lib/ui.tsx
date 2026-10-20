// Shared UI primitives extracted from the original App.tsx so every page (and
// the new login / staff pages) reuse the same icons, routing and presentational
// components — keeping the visual identity of the Figma prototype intact.

import { useEffect, useState } from "react"

export type IconName =
  | "search" | "bell" | "arrow" | "arrowUp" | "sparkle" | "file" | "check"
  | "chevron" | "passport" | "graduation" | "briefcase" | "award" | "bank"
  | "users" | "shield" | "clock" | "download" | "calendar" | "lock" | "menu"
  | "close" | "filter" | "send" | "eye" | "info" | "building" | "refresh"
  | "more" | "book" | "mail" | "logout" | "grid" | "alert" | "plus" | "user"

type Path = { d: string; fill?: string }

export const iconPaths: Record<IconName, Path[]> = {
  search: [
    { d: "m20 20-4.2-4.2" },
    { d: "M17.5 10.5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" },
  ],
  bell: [{ d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" }],
  arrow: [{ d: "M4 12h16m-6-6 6 6-6 6" }],
  arrowUp: [{ d: "M5 19 19 5M8 5h11v11" }],
  sparkle: [
    {
      d: "m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 17l.6 1.4L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.6L19 17Z",
    },
  ],
  file: [
    { d: "M6 2.75h8l4 4V21H6a2 2 0 0 1-2-2V4.75a2 2 0 0 1 2-2Z" },
    { d: "M14 3v4h4M8 12h6M8 16h7" },
  ],
  check: [{ d: "m4 12 5 5L20 6" }],
  chevron: [{ d: "m9 5 7 7-7 7" }],
  passport: [
    {
      d: "M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM4 7h16M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM8 14h8M12 10v8",
    },
  ],
  graduation: [
    { d: "m2 9 10-5 10 5-10 5L2 9ZM6 11v5c3.5 3 8.5 3 12 0v-5M22 9v7" },
  ],
  briefcase: [
    {
      d: "M4 7h16a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2ZM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M2 13c6 3 14 3 20 0M10 13h4",
    },
  ],
  award: [{ d: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM8 14 6 22l6-3 6 3-2-8" }],
  bank: [{ d: "m2 9 10-6 10 6H2ZM4 20h16M6 10v8m4-8v8m4-8v8m4-8v8M2 22h20" }],
  users: [
    {
      d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    },
  ],
  shield: [
    { d: "m12 2 8 4v5c0 5.2-3.3 8.8-8 11-4.7-2.2-8-5.8-8-11V6l8-4Z" },
    { d: "m9 12 2 2 4-4" },
  ],
  clock: [{ d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2" }],
  download: [{ d: "M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3" }],
  calendar: [{ d: "M4 5h16v16H4V5ZM8 3v4m8-4v4M4 10h16" }],
  lock: [{ d: "M5 10h14v11H5V10ZM8 10V7a4 4 0 1 1 8 0v3M12 14v3" }],
  menu: [{ d: "M4 7h16M4 12h16M4 17h16" }],
  close: [{ d: "M5 5 19 19M19 5 5 19" }],
  filter: [{ d: "M3 6h18M6 12h12m-9 6h6" }],
  send: [{ d: "m3 3 18 9-18 9 3-9-3-9ZM6 12h15" }],
  eye: [
    {
      d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    },
  ],
  info: [{ d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v6M12 7h.01" }],
  building: [
    { d: "M4 21V5l8-3 8 3v16M2 21h20M9 21v-5h6v5M8 8h1m6 0h1M8 12h1m6 0h1" },
  ],
  refresh: [
    {
      d: "M20 7v5h-5M4 17v-5h5M5.5 9A7 7 0 0 1 18 6l2 1M4 17l2 1a7 7 0 0 0 12.5-3",
    },
  ],
  more: [{ d: "M5 12h.01M12 12h.01M19 12h.01" }],
  book: [
    {
      d: "M4 4h13a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V4ZM4 18a3 3 0 0 1 3-3h13M8 8h8m-8 3h6",
    },
  ],
  mail: [{ d: "M3 5h18v14H3V5Zm0 1 9 7 9-7" }],
  logout: [{ d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" }],
  grid: [{ d: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" }],
  alert: [{ d: "M12 3 2 21h20L12 3ZM12 9v5M12 18h.01" }],
  plus: [{ d: "M12 5v14M5 12h14" }],
  user: [
    { d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" },
  ],
}

export function Icon({
  name,
  size = 20,
  stroke = 1.8,
  className = "",
}: {
  name: IconName
  size?: number
  stroke?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name].map((path, i) => (
        <path key={i} {...path} />
      ))}
    </svg>
  )
}

// --- lightweight client-side router (preserves the prototype's approach) ------

export function navigate(path: string) {
  if (window.location.pathname + window.location.search === path) {
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }
  window.history.pushState({}, "", path)
  window.dispatchEvent(new PopStateEvent("popstate"))
  window.scrollTo({ top: 0, behavior: "smooth" })
}

export function usePath() {
  const [path, setPath] = useState(
    () => window.location.pathname + window.location.search,
  )
  useEffect(() => {
    const update = () =>
      setPath(window.location.pathname + window.location.search)
    window.addEventListener("popstate", update)
    return () => window.removeEventListener("popstate", update)
  }, [])
  return path
}

/** Match a pattern like "/documents/:slug" against the current path. */
export function matchRoute(
  pattern: string,
  fullPath: string,
): Record<string, string> | null {
  const [pathOnly] = fullPath.split("?")
  const pParts = pattern.split("/").filter(Boolean)
  const aParts = pathOnly.split("/").filter(Boolean)
  if (pParts.length !== aParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pParts.length; i++) {
    const p = pParts[i]
    const a = aParts[i]
    if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(a)
    else if (p !== a) return null
  }
  return params
}

export function LinkButton({
  to,
  children,
  className = "",
  onClick,
}: {
  to: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        onClick?.()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  link,
  to,
}: {
  eyebrow?: string
  title: string
  link?: string
  to?: string
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {link && to && (
        <LinkButton to={to} className="text-link">
          {link}
          <Icon name="arrow" size={17} />
        </LinkButton>
      )}
    </div>
  )
}

export function Status({
  children,
  kind = "ready",
}: {
  children: React.ReactNode
  kind?: "ready" | "review" | "warning" | "muted"
}) {
  return (
    <span className={`status status-${kind}`}>
      <span className="status-dot" />
      {children}
    </span>
  )
}

// Map the backend status to the coloured chip used across the UI.
export function statusKindFor(status: string): "ready" | "review" | "warning" | "muted" {
  switch (status) {
    case "approved":
      return "ready"
    case "submitted":
    case "under_review":
      return "review"
    case "correction_required":
    case "rejected":
      return "warning"
    default:
      return "muted"
  }
}


// Format an ISO date string into a friendly, readable label (e.g. "28 Sep 2026").
export function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// Relative-ish label for activity timestamps.
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Five-step progress labels shown on request cards.
export const PROGRESS_STEPS = [
  "Submitted",
  "Eligibility checked",
  "Department review",
  "Document creation",
  "Delivery",
]

// Map a request status to a progress bar state.
export function progressForStatus(status: string): {
  done: number
  current: number
  kind: "ready" | "review" | "warning" | "muted"
} {
  switch (status) {
    case "draft":
      return { done: 0, current: 0, kind: "muted" }
    case "submitted":
      return { done: 1, current: 1, kind: "review" }
    case "under_review":
      return { done: 2, current: 2, kind: "review" }
    case "correction_required":
      return { done: 2, current: 2, kind: "warning" }
    case "approved":
      return { done: 5, current: -1, kind: "ready" }
    case "rejected":
      return { done: 2, current: 2, kind: "warning" }
    default:
      return { done: 0, current: 0, kind: "muted" }
  }
}
