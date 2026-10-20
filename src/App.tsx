import { useEffect, useMemo, useState } from "react"

import { useAuth } from "./lib/auth"
import {
  Icon,
  LinkButton,
  SectionHeading,
  Status,
  formatDate,
  formatDateTime,
  navigate,
  usePath,
  matchRoute,
  statusKindFor,
  progressForStatus,
  PROGRESS_STEPS,
  type IconName,
} from "./lib/ui"
import {
  DocumentApi,
  RequestApi,
  type Activity,
  type DocumentDoc,
  type RequestDoc,
  type User,
} from "./lib/api"
import { Header, Footer } from "./components/Layout"
import { Login } from "./pages/Login"
import { StaffDashboard } from "./pages/StaffDashboard"

// ---------------------------------------------------------------------------
// Static UI configuration (navigation shortcuts, not data to persist).
// ---------------------------------------------------------------------------
type Purpose = { title: string; subtitle: string; icon: IconName; tone: string; query: string }
const purposes: Purpose[] = [
  { title: "Visa", subtitle: "Travel & visa proof", icon: "passport", tone: "lilac", query: "visa" },
  { title: "Higher Studies", subtitle: "University applications", icon: "graduation", tone: "yellow", query: "higher studies" },
  { title: "Internship", subtitle: "Institutional verification", icon: "briefcase", tone: "peach", query: "internship" },
  { title: "Scholarship", subtitle: "Academic support", icon: "award", tone: "mint", query: "scholarship" },
  { title: "Bank Loan", subtitle: "Education loan papers", icon: "bank", tone: "blue", query: "bank loan" },
  { title: "Placement", subtitle: "Employer verification", icon: "users", tone: "orange", query: "placement" },
]

const FREQUENT = [
  { name: "Bonafide", slug: "bonafide" },
  { name: "Transcript", slug: "transcript" },
  { name: "NOC", slug: "noc" },
  { name: "Recommendation Letter", slug: "recommendation-letter" },
]

const TAG_TONES = ["lilac", "blue", "mint", "peach", "yellow", "orange"]
const PURPOSE_OPTIONS = [
  "Visa application", "Bank loan", "Scholarship", "Internship", "Passport",
  "Higher studies", "Placement", "Something else",
]

// ---------------------------------------------------------------------------
// Small shared presentational helpers.
// ---------------------------------------------------------------------------
function SearchBox({ initial = "", variant = "home" }: { initial?: string; variant?: "home" | "discover" }) {
  const [value, setValue] = useState(initial)
  useEffect(() => setValue(initial), [initial])
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/search${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`)
  }
  return (
    <form className={`search-box search-${variant}`} onSubmit={submit}>
      <Icon name="search" size={24} className="search-leading" />
      <input
        aria-label="Search by purpose or document"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={variant === "home" ? "I need a document for…" : "Try: I need a document for my visa application"}
      />
      <span className="search-sparkle"><Icon name="sparkle" size={19} /></span>
      <button className="search-submit" type="submit" aria-label="Search"><Icon name="arrow" size={20} /></button>
    </form>
  )
}

function PageLoading({ label = "Loading…" }: { label?: string }) {
  return <div className="page-loading"><Icon name="refresh" size={20} /> {label}</div>
}

function NotFound({ message }: { message?: string }) {
  return (
    <div className="empty-state">
      <Icon name="search" size={29} />
      <h3>Not found</h3>
      <p>{message || "We couldn't find what you were looking for."}</p>
      <LinkButton to="/" className="secondary-button">Back home</LinkButton>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
function Home() {
  const [issued, setIssued] = useState<RequestDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    RequestApi.list("approved")
      .then((d) => setIssued(d.requests))
      .catch(() => setIssued([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="page home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="home-hero-title">What are you<br /><em>applying for?</em></h1>
          <p className="hero-description">Tell us what you need. We'll help you find the right academic document.</p>
          <SearchBox />
          <div className="search-helper">
            <Icon name="sparkle" size={15} />
            <span>Not sure what you need? <LinkButton to="/search">Ask AcaFlow <Icon name="arrow" size={14} /></LinkButton></span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-scribble art-scribble-one">✳</span>
          <span className="art-scribble art-scribble-two">✳</span>
          <div className="art-circle" />
          <div className="art-paper art-paper-back"><div className="art-lines"><i /><i /><i /></div></div>
          <div className="art-paper art-paper-front">
            <div className="art-paper-top"><span className="art-mini-mark">A</span><span className="art-mini-dots">•••</span></div>
            <div className="art-paper-rule short" /><div className="art-paper-rule" /><div className="art-paper-rule medium" />
            <div className="art-seal"><Icon name="check" size={22} stroke={2.2} /></div>
          </div>
          <div className="art-floating-tag"><span className="art-tag-icon"><Icon name="check" size={15} /></span> Good to go!</div>
        </div>
      </section>

      <section className="section purpose-section">
        <SectionHeading eyebrow="START WITH YOUR PURPOSE" title="Applying For?" />
        <div className="purpose-grid">
          {purposes.map((p) => (
            <LinkButton key={p.title} to={`/search?q=${encodeURIComponent(p.query)}`} className={`purpose-card tone-${p.tone}`}>
              <span className="purpose-icon"><Icon name={p.icon} size={25} stroke={1.6} /></span>
              <span className="purpose-card-bottom">
                <span><strong>{p.title}</strong><small>{p.subtitle}</small></span>
                <Icon name="arrowUp" size={18} className="purpose-arrow" />
              </span>
            </LinkButton>
          ))}
        </div>
      </section>

      <section className="section documents-section">
        <SectionHeading eyebrow="ALREADY IN YOUR CORNER" title="Documents you already have" link="Explore all documents" to="/search" />
        <div className="available-scroll">
          {loading ? (
            <PageLoading label="Fetching your documents…" />
          ) : issued.length === 0 ? (
            <div className="available-empty">
              You don't have issued documents yet. <LinkButton to="/search">Explore documents</LinkButton> to request one.
            </div>
          ) : (
            issued.map((doc) => (
              <LinkButton key={doc.requestId} to={`/documents/${doc.documentSlug}`} className="available-card">
                <span className={`available-icon tone-${doc.documentTone || "lilac"}`}>
                  <Icon name={(doc.documentIcon as IconName) || "file"} size={25} stroke={1.5} />
                </span>
                <strong>{doc.documentName}</strong>
                <Status>Available</Status>
              </LinkButton>
            ))
          )}
        </div>
      </section>

      <section className="section frequent-section">
        <SectionHeading eyebrow="QUICK ACCESS" title="Frequently requested" />
        <div className="frequent-list">
          {FREQUENT.map((f, i) => (
            <LinkButton key={f.slug} to={`/documents/${f.slug}`} className="frequent-item">
              <span className="frequent-number">0{i + 1}</span>
              <span>{f.name}</span>
              <Icon name="arrowUp" size={18} />
            </LinkButton>
          ))}
        </div>
      </section>

      <div className="home-note">
        <Icon name="lock" size={17} /> Your academic information is only visible to authorized university staff.
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Document details (data-driven, any document) + request form
// ---------------------------------------------------------------------------
function CertificateArt() {
  return (
    <div className="certificate-art" aria-hidden="true">
      <div className="certificate-halo" />
      <div className="certificate-sheet">
        <div className="certificate-top">
          <div className="certificate-crest"><Icon name="building" size={28} stroke={1.4} /></div>
          <div className="certificate-top-lines"><i /><i /></div>
        </div>
        <div className="certificate-heading-line" />
        <div className="certificate-line wide" /><div className="certificate-line" /><div className="certificate-line medium" />
        <div className="certificate-line wide" /><div className="certificate-line short" />
        <div className="certificate-bottom">
          <span className="certificate-signature">AcaFlow</span>
          <span className="certificate-stamp"><Icon name="check" size={30} /></span>
        </div>
      </div>
      <div className="certificate-available"><Icon name="shield" size={18} /> Verified by your university</div>
    </div>
  )
}

function RequestForm({ doc, onClose, onDone }: { doc: DocumentDoc; onClose: () => void; onDone: (id: string) => void }) {
  const notReady = doc.requirements.filter((r) => !r.ready)
  const [step, setStep] = useState(1)
  const [purpose, setPurpose] = useState("")
  const [notes, setNotes] = useState("")
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    Object.fromEntries(notReady.map((r) => [r.name, ""])),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [createdId, setCreatedId] = useState("")

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !createdId) onClose() }
    document.addEventListener("keydown", esc)
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = "" }
  }, [onClose, createdId])

  async function submit(draft = false) {
    setSubmitting(true)
    setError("")
    try {
      const { request } = await RequestApi.create({
        documentSlug: doc.slug,
        purpose,
        notes,
        formData,
        draft,
      })
      if (draft) onDone(request.requestId)
      else setCreatedId(request.requestId)
    } catch (e: any) {
      setError(e.message || "Could not submit your request.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !createdId) onClose() }}>
      <div className="apply-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{doc.name.toUpperCase()}</span>
            <h2 id="apply-title">{step === 1 ? "What's it for?" : step === 2 ? "One last check" : "Request received!"}</h2>
          </div>
          {!createdId && <button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={21} /></button>}
        </div>
        <div className="modal-progress">
          <span className={step >= 1 ? "filled" : ""} />
          <span className={step >= 2 ? "filled" : ""} />
          <span className={step >= 3 ? "filled" : ""} />
        </div>

        {error && <div className="auth-error modal-error"><Icon name="alert" size={17} /> {error}</div>}

        {step === 1 && (
          <div className="modal-body">
            <p>We'll tailor your request to what you need. You can choose a purpose or describe it in your own words.</p>
            <label htmlFor="purpose-select">I need this for</label>
            <select id="purpose-select" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option value="">Choose a purpose</option>
              {PURPOSE_OPTIONS.map((p) => <option key={p}>{p}</option>)}
            </select>

            {purpose && notReady.length > 0 && (
              <>
                <div className="modal-subhead">A few details this document needs</div>
                {notReady.map((req) => (
                  <div key={req.name} className="field-group">
                    <label htmlFor={`field-${req.name}`}>{req.name}</label>
                    <input
                      id={`field-${req.name}`}
                      value={formData[req.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [req.name]: e.target.value })}
                      placeholder={`Enter ${req.name.toLowerCase()}`}
                    />
                  </div>
                ))}
              </>
            )}

            <label htmlFor="purpose-details">Anything else we should know? <span>(optional)</span></label>
            <textarea id="purpose-details" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder={purpose === "Visa application" ? "e.g. Embassy or country name" : "Add any helpful details here"} />

            <button className="primary-button modal-next" disabled={!purpose || submitting} onClick={() => setStep(2)}>
              Continue <Icon name="arrow" size={18} />
            </button>
            <button className="back-button modal-draft" disabled={submitting} onClick={() => submit(true)}>
              Save as draft
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="modal-body">
            <p>We've checked the basics before sending this to the Department.</p>
            <div className="modal-checks">
              {doc.eligibility.map((t) => (
                <div key={t}><Icon name="check" size={17} /> {t}</div>
              ))}
            </div>
            <div className="modal-summary">
              <span>YOUR REQUEST</span>
              <strong>{doc.name}</strong>
              <small>Purpose: {purpose}</small>
              {notes && <small>Note: {notes}</small>}
              {Object.entries(formData).filter(([, v]) => v).map(([k, v]) => (
                <small key={k}>{k}: {v}</small>
              ))}
            </div>
            <div className="modal-actions">
              <button className="back-button" onClick={() => setStep(1)}>Back</button>
              <button className="primary-button" disabled={submitting} onClick={() => submit(false)}>
                {submitting ? "Submitting…" : "Submit request"} {!submitting && <Icon name="arrow" size={18} />}
              </button>
            </div>
          </div>
        )}

        {step === 3 && createdId && (
          <div className="modal-body modal-success">
            <span className="success-icon"><Icon name="check" size={31} /></span>
            <p>Your request is on its way. We'll keep you updated at every step — no guessing where it is.</p>
            <div className="modal-request-id">Request ID: <strong>#{createdId}</strong></div>
            <button className="primary-button" onClick={() => onDone(createdId)}>
              Track in My Requests <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Details({ slug }: { slug: string }) {
  const [doc, setDoc] = useState<DocumentDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [applyOpen, setApplyOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError("")
    DocumentApi.bySlug(slug)
      .then((d) => setDoc(d.document))
      .catch((e) => setError(e.message || "Document not found."))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <main className="page detail-page"><div className="breadcrumbs"><LinkButton to="/search">Explore Documents</LinkButton></div><PageLoading /></main>
  if (error || !doc) return <main className="page detail-page"><NotFound message={error} /></main>

  const firstName = doc.name.split(" ")[0]

  return (
    <main className="page detail-page">
      <div className="breadcrumbs">
        <LinkButton to="/search">Explore Documents</LinkButton>
        <Icon name="chevron" size={14} />
        <span>{doc.name}</span>
      </div>
      <section className="detail-hero">
        <CertificateArt />
        <div className="detail-intro">
          <div className="eyebrow">{doc.category.toUpperCase()} · STUDENT SERVICES</div>
          <h1>{doc.name}<span className="title-period">.</span></h1>
          <p>{doc.description}</p>
          <div className="detail-meta">
            <div><Icon name="award" size={20} /><strong>{doc.fee}</strong><small>{doc.feeNote}</small></div>
            <div><Icon name="send" size={20} /><strong>{doc.delivery}</strong><small>{doc.deliveryNote}</small></div>
            <div><Icon name="clock" size={20} /><strong>{doc.processingTime}</strong><small>{doc.processingNote}</small></div>
            <div><Icon name="users" size={20} /><strong>{doc.audience}</strong><small>{doc.audienceNote}</small></div>
          </div>
          <button className="primary-button detail-apply-top" onClick={() => setApplyOpen(true)}>
            Apply for {firstName} <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>

      <section className="section detail-purpose">
        <div className="detail-section-title">
          <div className="eyebrow">THE BASICS</div>
          <h2>What is it used for?</h2>
        </div>
        <div>
          <p>{doc.uses}</p>
          <div className="tag-row">
            {doc.useTags.map((t, i) => (
              <span key={t} className={`purpose-tag tone-${TAG_TONES[i % TAG_TONES.length]}`}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section requirements-section">
        <SectionHeading eyebrow="NO SURPRISES" title="What you need" />
        <p className="section-intro">We'll use what's already in your account. You can add anything else while applying.</p>
        <div className="requirements-scroll">
          {doc.requirements.map((req) => (
            <div key={req.name} className="requirement-card">
              <span className="requirement-icon"><Icon name={(req.icon as IconName) || "file"} size={22} /></span>
              <strong>{req.name}</strong>
              <span className={req.ready ? "requirement-ready" : "requirement-add"}>
                {req.ready ? <><Icon name="check" size={13} /> Available in AcaFlow</> : "Add when applying"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section process-section">
        <SectionHeading eyebrow="FROM REQUEST TO READY" title="How it works" />
        <p className="section-intro">No mystery steps. Here's the journey your request takes.</p>
        <div className="workflow">
          {doc.workflow.map((step, i) => (
            <div className="workflow-step" key={step.number}>
              <div className={`workflow-node tone-${step.tone}`}>
                <div className="workflow-node-top">
                  <span>{step.number}</span>
                  <Icon name={(step.icon as IconName) || "file"} size={23} stroke={1.6} />
                </div>
                <div><strong>{step.title}</strong><small>{step.description}</small></div>
              </div>
              {i < doc.workflow.length - 1 && <span className="workflow-connector"><Icon name="arrow" size={17} /></span>}
            </div>
          ))}
        </div>
      </section>

      <section className="section eligibility-section">
        <div>
          <div className="eyebrow">BEFORE YOU APPLY</div>
          <h2>You're nearly there.</h2>
          <p>We check the essentials first so your request goes to the right place.</p>
        </div>
        <div className="eligibility-card">
          <div className="eligibility-checks">
            {doc.eligibility.map((t) => (
              <div key={t}><span><Icon name="check" size={15} /></span>{t}</div>
            ))}
          </div>
          <div className="manual-review">
            <Icon name="info" size={20} />
            <p><strong>Not eligible?</strong> Your request will go to a staff member for manual review instead of being rejected automatically.</p>
          </div>
        </div>
      </section>

      <section className="apply-banner">
        <div>
          <span className="eyebrow">READY WHEN YOU ARE</span>
          <h2>Let's get it done.</h2>
          <p>Just a few details, then we'll take it from there.</p>
        </div>
        <div className="apply-banner-action">
          <button className="primary-button" onClick={() => setApplyOpen(true)}>
            Apply for {doc.name} <Icon name="arrow" size={19} />
          </button>
          <span><Icon name="clock" size={15} /> Takes about 2 minutes</span>
        </div>
      </section>

      {applyOpen && (
        <RequestForm doc={doc} onClose={() => setApplyOpen(false)} onDone={(id) => { setApplyOpen(false); navigate(`/requests?new=${id}`) }} />
      )}
    </main>
  )
}

// ---------------------------------------------------------------------------
// Search & Discover
// ---------------------------------------------------------------------------
function SearchPage() {
  const getQuery = () => new URLSearchParams(window.location.search).get("q") || ""
  const [query, setQuery] = useState(getQuery)
  const [category, setCategory] = useState("All")
  const [results, setResults] = useState<DocumentDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [allDocs, setAllDocs] = useState<DocumentDoc[]>([])
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    DocumentApi.list().then((d) => setAllDocs(d.documents)).catch(() => {})
    const update = () => { setQuery(getQuery()); setCategory("All") }
    window.addEventListener("popstate", update)
    return () => window.removeEventListener("popstate", update)
  }, [])

  // Debounced backend search whenever query/category changes.
  useEffect(() => {
    setLoading(true)
    setError("")
    const t = setTimeout(() => {
      DocumentApi.list(query, category)
        .then((d) => setResults(d.documents))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query, category])

  const normalized = query.toLowerCase().trim()
  const recommend = useMemo(() => {
    if (!normalized) return []
    const slugs = normalized.match(/master|abroad|higher/) ? ["transcript", "bonafide", "recommendation-letter"]
      : normalized.match(/visa/) ? ["bonafide", "enrollment-certificate", "transcript"]
        : normalized.match(/loan/) ? ["bonafide", "fee-receipt", "enrollment-certificate"]
          : normalized.match(/internship/) ? ["bonafide", "noc", "recommendation-letter"]
            : normalized.match(/placement|job/) ? ["transcript", "noc", "bonafide"]
              : normalized.match(/scholarship/) ? ["bonafide", "transcript", "fee-receipt"]
                : ["bonafide", "transcript", "noc"]
    return slugs.map((s) => allDocs.find((d) => d.slug === s)).filter(Boolean) as DocumentDoc[]
  }, [normalized, allDocs])

  const setSearch = (term: string) => {
    window.history.pushState({}, "", `/search${term ? `?q=${encodeURIComponent(term)}` : ""}`)
    setQuery(term)
    setCategory("All")
  }

  return (
    <main className="page search-page">
      <section className="search-heading">
        <div className="eyebrow">EXPLORE DOCUMENTS</div>
        <h1>Find the document<br /><em>you need.</em></h1>
        <p>Search by document name, purpose, or just tell us your situation.</p>
        <div className="search-main">
          <SearchBox key={query} initial={query} variant="discover" />
          <button className="ask-button" onClick={() => setAssistantOpen(!assistantOpen)} aria-expanded={assistantOpen}>
            <Icon name="sparkle" size={18} /> Ask AcaFlow
          </button>
        </div>
        <div className="quick-prompts">
          <span>Try a purpose:</span>
          {["For a visa", "For higher studies", "For a bank loan", "For an internship", "For placement", "For scholarship"].map((t) => (
            <button className="prompt-chip" key={t} onClick={() => setSearch(t.replace("For a ", "").replace("For ", ""))}>{t}</button>
          ))}
        </div>
        {assistantOpen && (
          <div className="assistant-panel">
            <span className="assistant-icon"><Icon name="sparkle" size={21} /></span>
            <div>
              <strong>Start with what you're working on.</strong>
              <p>Type something like "I'm applying for a master's abroad" above. We'll suggest documents that might help — you choose what to request.</p>
              <button onClick={() => { setSearch("I need documents for my master's application abroad"); setAssistantOpen(false) }}>
                Try an example <Icon name="arrow" size={15} />
              </button>
            </div>
            <button className="assistant-close" aria-label="Close suggestion" onClick={() => setAssistantOpen(false)}><Icon name="close" size={18} /></button>
          </div>
        )}
      </section>

      {normalized.length >= 3 && recommend.length > 0 && (
        <section className="recommendation">
          <div className="recommendation-heading">
            <span className="recommendation-star"><Icon name="sparkle" size={19} /></span>
            <div>
              <span className="eyebrow">BASED ON YOUR PURPOSE</span>
              <h2>We think you may need</h2>
            </div>
          </div>
          <div className="recommendation-list">
            {recommend.map((doc) => (
              <LinkButton key={doc.slug} to={`/documents/${doc.slug}`} className="recommendation-item">
                <span className="rec-icon"><Icon name={(doc.icon as IconName) || "file"} size={21} /></span>
                <span><strong>{doc.name}</strong><small>{doc.short}</small></span>
                <Icon name="arrowUp" size={18} />
              </LinkButton>
            ))}
          </div>
          <p className="recommendation-note"><Icon name="info" size={15} /> Suggestions are a starting point. You're always in control of what you request.</p>
        </section>
      )}

      <section className="results-section">
        <div className="results-top">
          <div>
            <div className="eyebrow">THE DOCUMENT LIBRARY</div>
            <h2>
              {query ? "Matching documents" : "Browse documents"} <span className="result-count">{loading ? "…" : results.length}</span>
            </h2>
          </div>
          <div className="sort-wrap">
            <button className="sort-button" onClick={() => setSortOpen(!sortOpen)} aria-expanded={sortOpen}>
              <Icon name="filter" size={18} /> Filter &amp; sort
            </button>
            {sortOpen && (
              <div className="sort-popover">
                <strong>Showing</strong>
                <p>Documents relevant to your search and available services.</p>
                <button onClick={() => { setCategory("All"); setSortOpen(false) }}>Show all documents</button>
              </div>
            )}
          </div>
        </div>
        <div className="category-filters" role="group" aria-label="Filter documents by category">
          {["All", "Certificates", "Academic Records", "Letters", "NOC"].map((c) => (
            <button key={c} className={category === c ? "selected" : ""} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>

        {error ? (
          <div className="auth-error staff-error"><Icon name="alert" size={17} /> {error}</div>
        ) : loading ? (
          <PageLoading label="Searching documents…" />
        ) : (
          <div className="results-grid">
            {results.map((doc) => (
              <LinkButton key={doc.slug} to={`/documents/${doc.slug}`} className="result-card">
                <div className="result-card-top">
                  <span className={`result-icon tone-${doc.tone}`}><Icon name={(doc.icon as IconName) || "file"} size={27} stroke={1.5} /></span>
                  <Icon name="arrowUp" size={20} className="result-arrow" />
                </div>
                <h3>{doc.name}</h3>
                <p>{doc.short}</p>
                <div className="result-tags">{doc.tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}</div>
                <div className="result-footer">
                  <Status kind={doc.status.includes("approval") ? "review" : "ready"}>{doc.status}</Status>
                  <span>View details <Icon name="chevron" size={14} /></span>
                </div>
              </LinkButton>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="empty-state">
            <Icon name="search" size={29} />
            <h3>No exact matches yet</h3>
            <p>Try another purpose, or browse all documents. If you're unsure, our student desk can help.</p>
            <button className="secondary-button" onClick={() => { setSearch(""); setCategory("All") }}>Browse all documents</button>
          </div>
        )}
      </section>
    </main>
  )
}

// ---------------------------------------------------------------------------
// My Requests
// ---------------------------------------------------------------------------
function nextStepFor(status: string): string {
  switch (status) {
    case "submitted": return "Eligibility check"
    case "under_review": return "Academic Office"
    case "correction_required": return "Your update needed"
    case "approved": return "Completed"
    case "rejected": return "Closed"
    default: return "—"
  }
}

function ProgressBar({ status }: { status: string }) {
  const prog = progressForStatus(status)
  const fill = prog.current >= 0 ? `${(prog.current / 5) * 100}%` : `${(prog.done / 5) * 100}%`
  return (
    <div className="request-progress">
      <div className="progress-track"><div className="progress-fill" style={{ width: fill }} /></div>
      <div className="progress-steps">
        {PROGRESS_STEPS.map((label, i) => {
          const cls = i < prog.done ? "done" : i === prog.current ? "current" : ""
          return (
            <div key={label} className={cls}>
              <span className="progress-point">{i < prog.done ? <Icon name="check" size={12} stroke={2.7} /> : null}</span>
              <span>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExpandedDetail({ req, detail }: { req: RequestDoc; detail: { request: RequestDoc; activity: Activity[] } | null }) {
  if (!detail || detail.request.requestId !== req.requestId) {
    return <div className="request-expanded"><PageLoading label="Loading details…" /></div>
  }
  return (
    <div className="request-expanded">
      <div className="expanded-heading"><Icon name="info" size={18} /><span>Your request is at <strong>{req.stage}</strong>. Here's the full picture.</span></div>
      <div className="expanded-grid">
        <div><small>Current stage</small><strong>{req.stage}</strong></div>
        <div><small>Submitted</small><strong>{formatDate(req.submittedAt)}</strong></div>
        <div><small>Expected completion</small><strong>{formatDate(req.expectedCompletion)}</strong></div>
        <div><small>Next step</small><strong>{nextStepFor(req.status)}</strong></div>
      </div>
      {detail.activity.length > 0 && (
        <ul className="request-timeline">
          {detail.activity.map((a) => (
            <li key={a._id}>
              <span className="staff-timeline-dot" />
              <div>
                <strong>{a.actor?.name || "AcaFlow"} <em>{a.action.replace(/_/g, " ")}</em></strong>
                <small>{formatDateTime(a.createdAt)}</small>
                {a.comment && <p>{a.comment}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {req.status === "correction_required" && req.reviewComment && (
        <div className="waiting-note">
          <strong>Staff note:</strong><span>{req.reviewComment}</span>
        </div>
      )}
    </div>
  )
}

function CompletedCard({ req }: { req: RequestDoc }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="request-card completed-request">
      <div className="completed-main">
        <span className={`request-icon tone-${req.documentTone || "mint"}`}>
          <Icon name={(req.documentIcon as IconName) || "file"} size={25} />
        </span>
        <div>
          <h2>{req.documentName}</h2>
          <p>Issued {formatDate(req.approvedAt)} <span>·</span> Request #{req.requestId}</p>
        </div>
      </div>
      <div className="completed-actions">
        <Status>Verified document</Status>
        <button className="outline-button" onClick={() => setOpen(!open)}>
          <Icon name="eye" size={17} /> {open ? "Hide Document" : "View Document"}
        </button>
        <button className="download-button" aria-label="Download document" onClick={() => setOpen(true)}>
          <Icon name="download" size={19} />
        </button>
      </div>
      {open && (
        <div className="completed-preview">
          <Icon name="shield" size={21} />
          <div>
            <strong>Your verified {req.documentName}</strong>
            <p>This is a clearly labelled sample document for demonstration. It is stored securely in your university account — AcaFlow does not claim this is an officially issued university record.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Requests() {
  const newId = new URLSearchParams(window.location.search).get("new") || ""
  const [requests, setRequests] = useState<RequestDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ request: RequestDoc; activity: Activity[] } | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const d = await RequestApi.list()
      setRequests(d.requests)
    } catch (e: any) {
      setError(e.message || "Could not load your requests.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const inProgress = requests.filter((r) => r.status === "submitted" || r.status === "under_review")
  const actionNeeded = requests.filter((r) => r.status === "correction_required" || r.status === "rejected")
  const completed = requests.filter((r) => r.status === "approved")

  const showActive = filter === "All" || filter === "In Progress"
  const showIssue = filter === "All" || filter === "Action Needed"
  const showCompleted = filter === "All" || filter === "Completed"

  async function toggleExpand(req: RequestDoc) {
    if (expandedId === req.requestId) { setExpandedId(null); setDetail(null); return }
    setExpandedId(req.requestId)
    setDetail(null)
    try {
      const d = await RequestApi.detail(req.requestId)
      setDetail(d)
    } catch { setDetail(null) }
  }

  async function resubmit(req: RequestDoc) {
    setBusy(true)
    try {
      await RequestApi.updateStatus(req.requestId, { action: "resubmit", purpose: req.purpose })
      await load()
    } catch (e: any) {
      setError(e.message || "Could not resubmit.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page requests-page">
      <div className="requests-heading">
        <div>
          <div className="eyebrow">YOUR STUDENT SPACE</div>
          <h1>My Requests<span className="title-period">.</span></h1>
          <p>See where your documents are — and what happens next.</p>
        </div>
        <LinkButton to="/search" className="secondary-button">Explore documents <Icon name="arrowUp" size={17} /></LinkButton>
      </div>

      {error && <div className="auth-error staff-error"><Icon name="alert" size={17} /> {error}</div>}

      <div className="request-filters" role="group" aria-label="Filter requests">
        {["All", "In Progress", "Action Needed", "Completed"].map((t) => (
          <button key={t} className={filter === t ? "selected" : ""} onClick={() => setFilter(t)}>
            {t}{t === "Action Needed" && actionNeeded.length > 0 && <span className="filter-alert">{actionNeeded.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoading label="Loading your requests…" />
      ) : (
        <>
          {showActive && (
            <section className="request-section">
              <div className="request-section-label">
                <span className="section-label-dot purple" /> IN PROGRESS <span className="section-label-count">{String(inProgress.length).padStart(2, "0")}</span>
              </div>
              {inProgress.map((req) => (
                <div key={req.requestId} className={`request-card active-request${req.requestId === newId ? " new-request" : ""}`}>
                  <div className="request-card-head">
                    <div className="request-name">
                      <span className={`request-icon tone-${req.documentTone || "lilac"}`}>
                        <Icon name={(req.documentIcon as IconName) || "file"} size={26} />
                      </span>
                      <div>
                        <h2>{req.documentName}</h2>
                        <p>For your {req.purpose.toLowerCase() || "request"} <span>·</span> Request #{req.requestId}</p>
                      </div>
                    </div>
                    <Status kind={statusKindFor(req.status)}>{req.stage}</Status>
                  </div>
                  {req.requestId === newId && (
                    <div className="new-request-note">
                      <Icon name="check" size={18} />
                      <span>Your request is in. We're checking your details before it goes to the Department. We'll let you know what happens next.</span>
                    </div>
                  )}
                  <ProgressBar status={req.status} />
                  <div className="request-bottom">
                    <div className="request-expected">
                      <Icon name="calendar" size={19} />
                      <span>Expected by <strong>{formatDate(req.expectedCompletion)}</strong></span>
                    </div>
                    <button className="outline-button" onClick={() => toggleExpand(req)} aria-expanded={expandedId === req.requestId}>
                      {expandedId === req.requestId ? "Hide Details" : "View Details"}
                      <Icon name="chevron" size={16} className={expandedId === req.requestId ? "rotate-down" : ""} />
                    </button>
                  </div>
                  {expandedId === req.requestId && <ExpandedDetail req={req} detail={detail} />}
                </div>
              ))}
              {inProgress.length === 0 && <div className="empty-state">No requests in progress.</div>}
            </section>
          )}

          {showIssue && (
            <section className="request-section">
              <div className="request-section-label">
                <span className="section-label-dot orange" /> NEEDS YOUR ATTENTION <span className="section-label-count">{String(actionNeeded.length).padStart(2, "0")}</span>
              </div>
              {actionNeeded.map((req) => (
                <div key={req.requestId} className="request-card issue-request">
                  <div className="issue-main">
                    <span className={`request-icon tone-${req.documentTone || "yellow"}`}>
                      <Icon name={(req.documentIcon as IconName) || "file"} size={25} />
                    </span>
                    <div>
                      <h2>{req.documentName}</h2>
                      <p>For your {req.purpose.toLowerCase() || "request"} <span>·</span> Request #{req.requestId}</p>
                      <div className="issue-message">
                        <Icon name="info" size={17} />
                        {req.status === "rejected"
                          ? "This request was not approved. You can start a new one if needed."
                          : (req.reviewComment || "This request needs a small update before it can continue.")}
                      </div>
                    </div>
                  </div>
                  <div className="issue-actions">
                    {req.status === "correction_required" && (
                      <button className="primary-button issue-resubmit" disabled={busy} onClick={() => resubmit(req)}>
                        {busy ? "Resubmitting…" : "Resubmit"} <Icon name="refresh" size={16} />
                      </button>
                    )}
                    <button className="outline-button" onClick={() => toggleExpand(req)} aria-expanded={expandedId === req.requestId}>
                      {expandedId === req.requestId ? "Hide Details" : "View Details"}
                      <Icon name="chevron" size={16} className={expandedId === req.requestId ? "rotate-down" : ""} />
                    </button>
                  </div>
                  {expandedId === req.requestId && <ExpandedDetail req={req} detail={detail} />}
                </div>
              ))}
              {actionNeeded.length === 0 && <div className="empty-state">Nothing needs your attention.</div>}
            </section>
          )}

          {showCompleted && (
            <section className="request-section">
              <div className="request-section-label">
                <span className="section-label-dot green" /> COMPLETED <span className="section-label-count">{String(completed.length).padStart(2, "0")}</span>
              </div>
              {completed.map((req) => <CompletedCard key={req.requestId} req={req} />)}
              {completed.length === 0 && <div className="empty-state">No completed requests yet.</div>}
            </section>
          )}

          {filter !== "All" && inProgress.length === 0 && actionNeeded.length === 0 && completed.length === 0 && (
            <div className="empty-state">No requests here yet.</div>
          )}
        </>
      )}

      <div className="requests-trust">
        <Icon name="lock" size={17} /> Your documents are shared only with you and authorized university staff.
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// App shell + routing
// ---------------------------------------------------------------------------
function SplashScreen() {
  return (
    <main className="page auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <span className="brand-mark" style={{ margin: "0 auto 18px", width: 34, height: 34, display: "grid", gap: 3, gridTemplateColumns: "repeat(2,1fr)" }}>
          <span /><span /><span /><span />
        </span>
        <h1 style={{ fontSize: 28 }}>AcaFlow<span className="title-period">.</span></h1>
        <p className="auth-sub"><Icon name="refresh" size={16} /> Loading…</p>
      </div>
    </main>
  )
}

function renderPage(path: string, user: User | null): React.ReactNode {
  const pathname = path.split("?")[0]
  if (pathname === "/") return <Home />
  if (pathname === "/search") return <SearchPage />
  const docMatch = matchRoute("/documents/:slug", path)
  if (docMatch) return <Details slug={docMatch.slug} />
  if (pathname === "/requests") return <Requests />
  if (pathname === "/staff") {
    if (user?.role === "staff" || user?.role === "admin") return <StaffDashboard />
    return <main className="page"><NotFound message="You don't have access to the staff review queue." /></main>
  }
  return <main className="page"><NotFound message="That page doesn't exist." /></main>
}

export default function App() {
  const path = usePath()
  const { user, loading } = useAuth()
  const pathname = path.split("?")[0]
  const isLogin = pathname === "/login"

  useEffect(() => {
    if (loading) return
    if (!user && !isLogin) {
      navigate(`/login?redirect=${encodeURIComponent(path)}`)
    } else if (user && isLogin) {
      navigate("/")
    }
  }, [loading, user, isLogin, path])

  if (loading) return <SplashScreen />
  if (!user && !isLogin) return <SplashScreen />
  if (isLogin) {
    if (user) return <SplashScreen />
    return <Login />
  }

  return (
    <>
      <Header path={path} />
      {renderPage(path, user)}
      {pathname !== "/" && <Footer />}
    </>
  )
}
