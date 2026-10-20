/**
 * The heart of the document-request workflow.
 *
 * Statuses flow:
 *   draft → submitted → under_review → approved / rejected
 *                                    ↘ correction_required → (resubmit) → submitted
 *
 * All allowed transitions and the roles permitted to perform them are declared
 * in one place so the rules live on the server and cannot be bypassed by the
 * client. The frontend mirrors these only for display; the backend is the
 * source of truth.
 */

export const STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  CORRECTION_REQUIRED: "correction_required",
};

export const ALL_STATUSES = Object.values(STATUS);

// Human-readable stage label shown to users, stored on each request as `stage`.
export const STAGE_LABELS = {
  draft: "Draft",
  submitted: "Eligibility Check",
  under_review: "Department Review",
  correction_required: "Correction Required",
  approved: "Document Issued",
  rejected: "Rejected",
};

// Maps a workflow "action" (sent in PATCH /requests/:id/status) to target status.
export const ACTION_TO_STATUS = {
  submit: STATUS.SUBMITTED,
  resubmit: STATUS.SUBMITTED,
  start_review: STATUS.UNDER_REVIEW,
  approve: STATUS.APPROVED,
  reject: STATUS.REJECTED,
  request_changes: STATUS.CORRECTION_REQUIRED,
  save_draft: STATUS.DRAFT,
};

// from → { to → [roles allowed to make this transition] }
const TRANSITIONS = {
  [STATUS.DRAFT]: {
    [STATUS.SUBMITTED]: ["student", "admin"],
  },
  [STATUS.SUBMITTED]: {
    [STATUS.UNDER_REVIEW]: ["staff", "admin"],
    [STATUS.APPROVED]: ["staff", "admin"],
    [STATUS.REJECTED]: ["staff", "admin"],
    [STATUS.CORRECTION_REQUIRED]: ["staff", "admin"],
  },
  [STATUS.UNDER_REVIEW]: {
    [STATUS.APPROVED]: ["staff", "admin"],
    [STATUS.REJECTED]: ["staff", "admin"],
    [STATUS.CORRECTION_REQUIRED]: ["staff", "admin"],
  },
  [STATUS.CORRECTION_REQUIRED]: {
    [STATUS.SUBMITTED]: ["student", "admin"],
    [STATUS.DRAFT]: ["student", "admin"],
  },
  [STATUS.APPROVED]: {},
  [STATUS.REJECTED]: {},
};

/** True if `role` may move a request from `from` to `to`. */
export function canTransition(from, to, role) {
  const allowed = TRANSITIONS[from]?.[to];
  return Array.isArray(allowed) && allowed.includes(role);
}

/** True if `value` is one of the defined statuses. */
export function isValidStatus(value) {
  return ALL_STATUSES.includes(value);
}

/** Friendly verb for an activity log entry, given the target status + action. */
export function actionVerb(action, newStatus) {
  switch (action) {
    case "submit":
      return "submitted";
    case "resubmit":
      return "resubmitted";
    case "start_review":
      return "started review of";
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "request_changes":
      return "requested changes to";
    case "save_draft":
      return "saved a draft of";
    default:
      return `updated status to ${newStatus}`;
  }
}
