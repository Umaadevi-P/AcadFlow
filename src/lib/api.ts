// Thin fetch-based API client. Reads the JWT from localStorage and attaches it
// as a Bearer token so components can call api.get("/documents") without
// passing credentials around. On a 401 it clears the token and notifies the
// AuthProvider so the app can return to the login screen.

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api"

const TOKEN_KEY = "acaflow_token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Shared response shapes used across pages.
export type User = {
  id: string
  name: string
  email: string
  role: "student" | "staff" | "admin"
  department?: string
  departmentCode?: string
  year?: string
  studentId?: string
  status: string
}

export type Requirement = { name: string; ready: boolean; icon: string }
export type WorkflowStep = {
  number: string
  title: string
  description: string
  icon: string
  tone: string
}

export type DocumentDoc = {
  _id: string
  name: string
  slug: string
  short: string
  description: string
  category: string
  tags: string[]
  purposes: string[]
  status: string
  icon: string
  tone: string
  fee: string
  feeNote: string
  delivery: string
  deliveryNote: string
  processingTime: string
  processingNote: string
  audience: string
  audienceNote: string
  eligibility: string[]
  requirements: Requirement[]
  uses: string
  useTags: string[]
  workflow: WorkflowStep[]
  active: boolean
  order: number
}

export type RequestDoc = {
  _id: string
  requestId: string
  user: User | { _id: string }
  document: string
  documentName: string
  documentSlug: string
  documentIcon: string
  documentTone: string
  purpose: string
  notes: string
  formData: Record<string, string>
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "correction_required"
  stage: string
  submittedAt: string
  expectedCompletion?: string
  approvedAt?: string
  assignedDepartment: string
  reviewComment: string
}

export type Activity = {
  _id: string
  actor: { name: string; role?: string }
  action: string
  previousStatus: string
  newStatus: string
  comment: string
  createdAt: string
}

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(
      "Could not reach the AcaFlow server. Make sure the backend is running.",
    )
  }

  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (res.status === 401) {
    setToken(null)
    window.dispatchEvent(new CustomEvent("acaflow:unauth"))
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && data.error) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }

  return data as T
}

export const api = {
  get: <T = any>(path: string) => request<T>("GET", path),
  post: <T = any>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T = any>(path: string, body?: unknown) =>
    request<T>("PATCH", path, body),
  setToken,
}

// Convenience wrappers returning typed payloads.
export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { email, password }),
  me: () => api.get<{ user: User }>("/auth/me"),
}

export const DocumentApi = {
  list: (q?: string, category?: string) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (category && category !== "All") params.set("category", category)
    const qs = params.toString()
    return api.get<{ documents: DocumentDoc[]; count: number }>(
      `/documents${qs ? `?${qs}` : ""}`,
    )
  },
  bySlug: (slug: string) =>
    api.get<{ document: DocumentDoc }>(`/documents/${slug}`),
}

export const RequestApi = {
  list: (status?: string) =>
    api.get<{ requests: RequestDoc[] }>(
      `/requests${status ? `?status=${status}` : ""}`,
    ),
  detail: (id: string) =>
    api.get<{ request: RequestDoc; activity: Activity[] }>(`/requests/${id}`),
  create: (body: {
    documentSlug: string
    purpose: string
    notes?: string
    formData?: Record<string, string>
    draft?: boolean
  }) => api.post<{ request: RequestDoc }>("/requests", body),
  updateStatus: (
    id: string,
    body: { action: string; comment?: string; purpose?: string; notes?: string },
  ) => api.patch<{ request: RequestDoc }>(`/requests/${id}/status`, body),
}
