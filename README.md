# AcaFlow — Academic Document Workflow System

AcaFlow is a web-based academic document workflow system for a university. It
digitises the process of **discovering, requesting, approving, tracking and
accessing** academic documents such as bonafide certificates, transcripts,
recommendation letters and more.

This repository turns the original Figma-generated React prototype into a
complete **MERN** application:

- **Frontend:** React + Vite + TypeScript + Tailwind (the existing prototype UI, preserved)
- **Backend:** Node.js + Express (REST API, JWT auth, role-based access)
- **Database:** MongoDB (via Mongoose)

The design — pastel palette, Blinker/Commissioner/Poppins type, rounded cards —
is kept intact. The interactions that were previously hard-coded are now driven
by a real backend and a real database.

---

## 1. Prerequisites

- **Node.js 18+** (developed on Node 24) — https://nodejs.org
- **npm** (ships with Node)
- **MongoDB** — one of:
  - **Local:** MongoDB Community Edition running on `mongodb://127.0.0.1:27017`
    (install from https://www.mongodb.com/try/download/community), **or**
  - **Cloud:** a free **MongoDB Atlas** cluster — https://www.mongodb.com/cloud/atlas

You do **not** need pnpm even though a `pnpm-lock.yaml` exists; this project uses
npm. You do **not** need Docker or any cloud service to run locally.

---

## 2. Project structure

```
AcaFlow Academic/
├── index.html              # Vite entry (Figma shell)
├── package.json            # Frontend dependencies & scripts
├── vite.config.ts          # Vite + Figma config (unchanged)
├── tsconfig.json
├── .env.example            # Frontend env template (VITE_API_URL)
├── src/                    # React frontend
│   ├── App.tsx             # Thin router + the four core pages + request form
│   ├── main.tsx            # Entry; wraps the app in <AuthProvider>
│   ├── index.css           # All styles (original + new pages)
│   ├── lib/
│   │   ├── ui.tsx          # Shared icons, router, Status, date/progress helpers
│   │   ├── api.ts          # Typed fetch client (Bearer token + 401 handling)
│   │   └── auth.tsx        # AuthProvider + useAuth
│   ├── components/
│   │   └── Layout.tsx      # Header + Footer (role-aware nav, logout)
│   └── pages/
│       ├── Login.tsx       # Sign-in page with demo-account quick-fill
│       └── StaffDashboard.tsx  # Staff/admin review queue
│
└── server/                 # Express + MongoDB backend
    ├── package.json
    ├── .env.example        # Backend env template
    └── src/
        ├── index.js        # Server entry (connect DB + listen)
        ├── app.js          # Express app factory (routes, middleware, CORS)
        ├── config/         # env.js, db.js
        ├── models/         # User, Document, Request, RequestActivity
        ├── middleware/     # auth.js, errorHandler.js
        ├── controllers/    # auth, document, request
        ├── routes/         # auth, document, request
        ├── utils/          # workflow.js (the status state machine)
        └── seed/           # seed.js (demo data)
    └── tests/             # workflow, API (E2E) and integration tests
```

---

## 3. Installation

Install dependencies for both the frontend and the backend:

```bash
# From the project root — frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

---

## 4. Environment setup

### Backend (`server/.env`)

Copy the template and edit if needed:

```bash
cp server/.env.example server/.env
```

`server/.env` contents (defaults shown):

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/acaflow
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:8443
```

- **`MONGODB_URI`** — use the local string above if MongoDB is installed
  locally, **or** paste your MongoDB Atlas connection string for a cloud DB.
- **`CLIENT_URL`** — the origin the frontend is served from (the Vite dev
  server runs on `http://localhost:8443`). The backend allows this origin via
  CORS.
- **`JWT_SECRET`** — change to any long random string before any real use.

### Frontend (optional)

For local development the frontend defaults to
`http://localhost:5000/api`, so no `.env` is required. To override (e.g. for
deployment), copy `.env.example` to `.env` and set `VITE_API_URL`.

### Database setup

- **Local MongoDB:** start the `mongod` service (it listens on port 27017).
  The backend creates the `acaflow` database and collections automatically.
- **MongoDB Atlas:** create a free cluster, add a database user, allow network
  access from your IP, copy the connection string into `MONGODB_URI`, e.g.
  `mongodb+srv://<user>:<password>@<cluster>/acaflow?retryWrites=true&w=majority`.

The backend prints a clear error and exits if it cannot reach MongoDB — it
never silently falls back to fake data.

---

## 5. Demo accounts

After seeding (see below), these accounts exist. The password for **all** is
`password123`:

| Role    | Email                     | Password     | Notes                                  |
|---------|---------------------------|--------------|----------------------------------------|
| Student | `umaadevi@university.edu` | `password123` | Main demo; has requests in several states |
| Student | `arjun@university.edu`    | `password123` | Second student (used to test request isolation) |
| Staff   | `staff@university.edu`    | `password123` | Reviews and decides on requests          |
| Admin   | `admin@university.edu`    | `password123` | Reviews requests + manages documents     |

This is **prototype/demo authentication** — passwords are hashed server-side
with bcrypt, but the app is **not** connected to a real university identity
system.

---

## 6. Running the app

You need **two terminals** — one for the backend, one for the frontend.

**Terminal 1 — backend (run once to seed, then start):**

```bash
cd server
npm run seed      # loads demo users, documents and sample requests
npm run dev       # starts the API on http://localhost:5000 (auto-restart)
# …or:  npm start    (no auto-restart)
```

**Terminal 2 — frontend:**

```bash
# from the project root
npm run dev       # starts Vite on http://localhost:8443
```

Open **http://localhost:8443** — you will be redirected to the login page.
Sign in with a demo account (use the quick-fill buttons on the login screen).

---

## 7. Seeding & re-seeding

```bash
cd server
npm run seed
```

The seed script **wipes and reloads** users, documents and requests, so it is
safe to re-run any time. It loads:

- 4 users (2 students, 1 staff, 1 admin)
- 6 documents (Bonafide, Academic Transcript, Recommendation Letter, NOC,
  Enrollment Certificate, Fee Receipt) — each with full details, requirements,
  workflow and eligibility
- 3 sample requests for the demo student in `under_review`,
  `correction_required` and `approved` states

---

## 8. Tests

The backend ships with three test suites that run against an **in-memory
MongoDB** (`mongodb-memory-server`), so they work without a local database
install (the MongoDB binary is downloaded once on first run).

```bash
cd server
npm test                 # workflow rules + end-to-end API tests (38 checks)
npm run test:workflow    # the workflow state-machine rules (no DB)
npm run test:e2e         # full API journey (login → create → review → approve)
npm run test:integration # cross-origin (CORS) smoke test
```

---

## 9. REST API

Base URL: `http://localhost:5000/api`

| Method | Endpoint                    | Purpose                                    | Access         |
|--------|----------------------------|--------------------------------------------|----------------|
| POST   | `/api/auth/login`          | Authenticate, returns `{ token, user }`     | Public         |
| GET    | `/api/auth/me`             | Current authenticated user                 | Authenticated  |
| POST   | `/api/auth/logout`         | Logout (stateless; client discards token)   | Authenticated  |
| GET    | `/api/documents`           | List/search (`?q=` and/or `?category=`)     | Authenticated  |
| GET    | `/api/documents/:slug`     | Document details by slug                    | Authenticated  |
| POST   | `/api/documents`           | Create a document config                    | Admin          |
| PATCH  | `/api/documents/:id`       | Update a document config                    | Admin          |
| POST   | `/api/requests`            | Create a request (or save a draft)          | Student/Admin  |
| GET    | `/api/requests`            | List requests (students see own; staff all) | Authenticated  |
| GET    | `/api/requests/:id`        | Request detail + activity history           | Owner/Staff/Admin |
| PATCH  | `/api/requests/:id/status` | Workflow action (start_review/approve/reject/request_changes/resubmit) | Role-checked |

Requests use a state-driven workflow:

```
draft → submitted → under_review → approved
                                  ↘ rejected
                                  ↘ correction_required → (resubmit) → submitted
```

All transitions and roles are enforced **server-side** in
`server/src/utils/workflow.js`; the client cannot approve its own request or
jump between arbitrary states.

---

## 10. The complete journey (what works end-to-end)

1. A student signs in.
2. They search for a document or pick a purpose (Visa, Higher Studies, …).
3. The backend returns matching documents from MongoDB (keyword + purpose
   matching, no AI).
4. The student opens a document details page (data-driven for any document).
5. They start a request via the request form, which adapts to the document's
   required fields.
6. They submit; the backend validates and stores the request with a real
   `AF-####` id.
7. The request appears in **My Requests** with a real status and progress bar.
8. Staff open the request from the **Review** queue, see the submitted details
   and activity history, and approve / reject / request changes (with a
   comment).
9. The decision is recorded as an activity entry and the status updates.
10. The student's page reflects the new status (e.g. a correction note, or an
    issued document).

Refreshing the page keeps the data — it is persisted in MongoDB.

---

## 11. Security notes (student-project level)

- Passwords are hashed with **bcrypt**; plaintext is never stored or returned.
- Protected routes require a **JWT** sent as a `Authorization: Bearer` header.
- Role-based access is enforced on the server (student / staff / admin).
- Students can only read and act on **their own** requests.
- Invalid workflow transitions are rejected with `409`.
- Centralised error handling hides stack traces from clients.
- Secrets live in environment variables, never in the frontend bundle.

This is a university demonstration project — it has **not** undergone a
professional security audit. JWTs are stored in `localStorage` for simplicity
(a common MERN pattern); see the limitations section.

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `MongoDB connection failed` on backend start | Start local `mongod`, or set `MONGODB_URI` to a valid Atlas string in `server/.env` |
| Frontend shows "Could not reach the AcaFlow server" | Start the backend first (`cd server && npm run dev`); confirm it is on port 5000 |
| CORS / blocked by CORS policy in the browser | Ensure `CLIENT_URL` in `server/.env` matches the frontend origin (`http://localhost:8443`); restart the backend |
| `401 Your session has expired` | Sign in again (the token expired) |
| `EADDRINUSE: address already in use :::5000` (or 8443) | Another process is using the port; change `PORT` in `server/.env` (and `VITE_API_URL` + vite port if needed) |
| Empty pages after login | Run `npm run seed` in `server/` to load demo data |
| `MONGOMS_TIMEOUT` during tests | The in-memory MongoDB needs longer to start; it is already set to 60s in the test files |

---

## 13. Deployment (optional, local-first)

Local running is the priority. If you want to host it:

- **Frontend:** build with `npm run build` and serve the `dist/` folder from any
  static host (Netlify, Vercel, S3). Set `VITE_API_URL` to your backend URL.
- **Backend:** deploy `server/` to any Node host (Render, Railway, Fly.io, an
  EC2 instance). Set the environment variables (especially `MONGODB_URI`,
  `JWT_SECRET`, `CLIENT_URL`).
- **Database:** use MongoDB Atlas.

No Docker/Kubernetes is required.

---

## 14. What changed from the original prototype

- The visual design, layout, copy, colors, fonts, icons and animations are
  preserved. New pages (login, staff dashboard) use the same design system.
- Hard-coded document/request data is now served by the Express + MongoDB API.
- Search, document details, My Requests and the request form now use real
  backend data with loading, empty and error states.
- Added: JWT authentication, role-based access, a login page, a per-document
  request form, a staff/admin review dashboard, request activity history, and
  a server-enforced workflow state machine.
- No new frontend dependencies were added; the backend uses
  `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` and
  `morgan`, with `mongodb-memory-server` (dev only) for tests.

---

## 15. Limitations / what is simulated

- **Authentication is a demo** — not connected to a real university SSO.
- **Issued documents** shown after approval are a clearly-labelled sample
  preview, not an officially generated/verified university file. AcaFlow does
  not claim the university has officially issued them.
- **File uploads** are not implemented; the request form collects text fields
  only (supporting-document metadata is demo-only), as allowed by the brief.
- **Notifications** in the header are a lightweight demo, not a live feed.
- **JWT in localStorage** is used for simplicity; for a production app an
  httpOnly-cookie + CSRF approach would be stronger.
