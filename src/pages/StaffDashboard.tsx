import { useEffect, useState } from "react"
import { useAuth } from "../lib/auth"
import {
  Icon,
  Status,
  formatDate,
  formatDateTime,
  statusKindFor,
  type IconName,
} from "../lib/ui"
import { RequestApi, type Activity, type RequestDoc } from "../lib/api"

// Which workflow actions a staff member may take from a given status.
function staffActions(status: string): { action: string; label: string; tone: string; icon: IconName }[] {
  switch (status) {
    case "submitted":
      return [
        { action: "start_review", label: "Start review", tone: "review", icon: "eye" },
        { action: "approve", label: "Approve", tone: "ready", icon: "check" },
        { action: "request_changes", label: "Request changes", tone: "warning", icon: "refresh" },
        { action: "reject", label: "Reject", tone: "warning", icon: "close" },
      ]
    case "under_review":
      return [
        { action: "approve", label: "Approve", tone: "ready", icon: "check" },
        { action: "request_changes", label: "Request changes", tone: "warning", icon: "refresh" },
        { action: "reject", label: "Reject", tone: "warning", icon: "close" },
      ]
    default:
      return []
  }
}

const FILTERS: { label: string; status?: string }[] = [
  { label: "All" },
  { label: "Submitted", status: "submitted" },
  { label: "Under Review", status: "under_review" },
  { label: "Needs Changes", status: "correction_required" },
  { label: "Approved", status: "approved" },
  { label: "Rejected", status: "rejected" },
]

function studentName(req: RequestDoc): string {
  const u = req.user as any
  if (u && typeof u === "object" && u.name) return u.name
  return "Student"
}

export function StaffDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<RequestDoc[]>([])
  const [filter, setFilter] = useState<string>("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ request: RequestDoc; activity: Activity[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState("")

  const statusParam = FILTERS.find((f) => f.label === filter)?.status

  async function loadList() {
    setLoading(true)
    setError("")
    try {
      const { requests } = await RequestApi.list(statusParam)
      setRequests(requests)
    } catch (err: any) {
      setError(err?.message || "Could not load requests.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam])

  async function openRequest(req: RequestDoc) {
    setSelectedId(req.requestId)
    setDetail(null)
    setDetailLoading(true)
    setComment("")
    setActionError("")
    try {
      const data = await RequestApi.detail(req.requestId)
      setDetail(data)
    } catch (err: any) {
      setActionError(err?.message || "Could not load request details.")
    } finally {
      setDetailLoading(false)
    }
  }

  async function doAction(action: string) {
    if (!detail) return
    if (action === "request_changes" && !comment.trim()) {
      setActionError("Add a comment explaining what the student needs to change.")
      return
    }
    setActionBusy(true)
    setActionError("")
    try {
      await RequestApi.updateStatus(detail.request.requestId, {
        action,
        comment: comment.trim(),
      })
      const refreshed = await RequestApi.detail(detail.request.requestId)
      setDetail(refreshed)
      setComment("")
      await loadList()
    } catch (err: any) {
      setActionError(err?.message || "That action could not be completed.")
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <main className="page staff-page">
      <div className="requests-heading staff-heading">
        <div>
          <div className="eyebrow">STAFF REVIEW</div>
          <h1>
            Review Queue<span className="title-period">.</span>
          </h1>
          <p>
            {user?.role === "admin"
              ? "All document requests across the system, ready for action."
              : "Requests assigned to your department, ready for your decision."}
          </p>
        </div>
      </div>

      <div className="request-filters" role="group" aria-label="Filter requests">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={filter === f.label ? "selected" : ""}
            onClick={() => setFilter(f.label)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="staff-error" role="alert">
          <Icon name="alert" size={17} /> {error}
        </div>
      )}

      <section className="staff-list">
        {loading ? (
          <div className="staff-empty">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <Icon name="check" size={29} />
            <h3>Nothing to review here</h3>
            <p>There are no requests with this status right now.</p>
          </div>
        ) : (
          requests.map((req) => (
            <button
              type="button"
              key={req.requestId}
              className="staff-request-card"
              onClick={() => openRequest(req)}
            >
              <span className={`request-icon tone-${req.documentTone || "lilac"}`}>
                <Icon name={(req.documentIcon as IconName) || "file"} size={24} />
              </span>
              <span className="staff-request-main">
                <strong>{req.documentName}</strong>
                <small>
                  {studentName(req)} · {req.purpose || "—"}
                </small>
                <span className="staff-request-id">#{req.requestId}</span>
              </span>
              <span className="staff-request-meta">
                <Status kind={statusKindFor(req.status)}>{req.stage}</Status>
                <small>Submitted {formatDate(req.submittedAt)}</small>
              </span>
              <Icon name="chevron" size={18} className="staff-request-chevron" />
            </button>
          ))
        )}
      </section>

      {selectedId && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null)
          }}
        >
          <div
            className="staff-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-review-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">REQUEST #{selectedId}</span>
                <h2 id="staff-review-title">
                  {detail ? detail.request.documentName : "Loading…"}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => setSelectedId(null)}
              >
                <Icon name="close" size={21} />
              </button>
            </div>

            {detailLoading ? (
              <div className="modal-body">
                <p>Loading request details…</p>
              </div>
            ) : detail ? (
              <>
                <div className="modal-body staff-review-body">
                  <div className="staff-review-grid">
                    <div>
                      <small>Student</small>
                      <strong>{studentName(detail.request)}</strong>
                    </div>
                    <div>
                      <small>Purpose</small>
                      <strong>{detail.request.purpose || "—"}</strong>
                    </div>
                    <div>
                      <small>Submitted</small>
                      <strong>{formatDate(detail.request.submittedAt)}</strong>
                    </div>
                    <div>
                      <small>Current status</small>
                      <strong>
                        <Status kind={statusKindFor(detail.request.status)}>
                          {detail.request.stage}
                        </Status>
                      </strong>
                    </div>
                  </div>

                  {detail.request.notes && (
                    <div className="staff-notes">
                      <small>Student note</small>
                      <p>{detail.request.notes}</p>
                    </div>
                  )}

                  {Object.keys(detail.request.formData || {}).length > 0 && (
                    <div className="staff-notes">
                      <small>Submitted details</small>
                      <ul className="staff-formdata">
                        {Object.entries(detail.request.formData).map(([k, v]) => (
                          <li key={k}>
                            <span>{k}</span>
                            <strong>{v}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detail.request.reviewComment && (
                    <div className="staff-comment-box">
                      <Icon name="info" size={17} />
                      <div>
                        <strong>Sent back to student</strong>
                        <p>{detail.request.reviewComment}</p>
                      </div>
                    </div>
                  )}

                  <div className="staff-activity">
                    <div className="eyebrow">ACTIVITY HISTORY</div>
                    <ul className="staff-timeline">
                      {detail.activity.map((a) => (
                        <li key={a._id}>
                          <span className="staff-timeline-dot" />
                          <div>
                            <strong>
                              {a.actor?.name || "Someone"}{" "}
                              <em>{a.action.replace(/_/g, " ")}</em>
                            </strong>
                            <small>{formatDateTime(a.createdAt)}</small>
                            {a.comment && <p>{a.comment}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {actionError && (
                  <div className="staff-action-error" role="alert">
                    <Icon name="alert" size={15} /> {actionError}
                  </div>
                )}

                <div className="staff-actions">
                  {staffActions(detail.request.status).length === 0 ? (
                    <p className="staff-awaiting">
                      <Icon name="clock" size={16} />
                      {detail.request.status === "correction_required"
                        ? "Awaiting the student's updated submission."
                        : "This request is closed — no further action needed."}
                    </p>
                  ) : (
                    <>
                      <textarea
                        className="staff-comment-input"
                        placeholder="Add a review comment (required when requesting changes)…"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                      />
                      <div className="staff-action-buttons">
                        {staffActions(detail.request.status).map((a) => (
                          <button
                            key={a.action}
                            className={`staff-action staff-action-${a.tone}`}
                            disabled={actionBusy}
                            onClick={() => doAction(a.action)}
                          >
                            <Icon name={a.icon} size={16} /> {a.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="modal-body">
                <p>{actionError || "Could not load this request."}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
