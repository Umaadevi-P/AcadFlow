import mongoose from "mongoose";
import { Request } from "../models/Request.js";
import { Document } from "../models/Document.js";
import { RequestActivity } from "../models/RequestActivity.js";
import { ApiError } from "../middleware/errorHandler.js";
import {
  STATUS,
  STAGE_LABELS,
  ACTION_TO_STATUS,
  canTransition,
  isValidStatus,
} from "../utils/workflow.js";

const isObjectId = (id) => mongoose.isValidObjectId(id);

// Add calendar days to a date (used for estimated completion).
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Generate the next human-friendly request id, e.g. "AF-2049", always above the
// highest existing numeric suffix so seeded ids like AF-2048 are never reused.
async function nextRequestId() {
  const existing = await Request.find({}, "requestId").lean();
  let max = 2000;
  for (const r of existing) {
    const m = /AF-(\d+)/i.exec(r.requestId || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `AF-${max + 1}`;
}

// Resolve a route param to a request by Mongo _id OR human requestId ("AF-2048").
// Returns a Mongoose query (thenable + chainable with .populate()), not a Promise.
function findRequest(idParam) {
  const query = isObjectId(idParam) ? { _id: idParam } : { requestId: String(idParam).toUpperCase() };
  return Request.findOne(query);
}

/** POST /api/requests — student creates a request (or saves a draft). */
export async function createRequest(req, res, next) {
  try {
    if (req.user.role !== "student" && req.user.role !== "admin") {
      throw new ApiError(403, "Only students can create document requests.");
    }

    const { documentSlug, purpose, notes, formData, draft } = req.body;
    if (!documentSlug) throw new ApiError(400, "Select a document to request.");

    const doc = await Document.findOne({ slug: String(documentSlug).toLowerCase(), active: true });
    if (!doc) throw new ApiError(404, "Document not found.");

    const isDraft = draft === true;
    if (!isDraft && (!purpose || !purpose.trim())) {
      throw new ApiError(400, "Please choose a purpose for this request.");
    }

    const status = isDraft ? STATUS.DRAFT : STATUS.SUBMITTED;
    const submittedAt = new Date();

    const request = await Request.create({
      requestId: await nextRequestId(),
      user: req.user._id,
      document: doc._id,
      documentName: doc.name,
      documentSlug: doc.slug,
      documentIcon: doc.icon,
      documentTone: doc.tone,
      purpose: (purpose || "").trim(),
      notes: (notes || "").trim(),
      formData: formData || {},
      status,
      stage: STAGE_LABELS[status],
      submittedAt,
      expectedCompletion: addDays(submittedAt, 5),
    });

    await RequestActivity.create({
      request: request._id,
      actor: req.user._id,
      actorName: req.user.name,
      action: isDraft ? "created" : "submitted",
      previousStatus: "",
      newStatus: status,
      comment: isDraft ? "Request saved as a draft." : "Request submitted by student.",
    });

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/requests — students see their own; staff/admin see all.
 * Optional query: ?status=submitted
 */
export async function listRequests(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "student") filter.user = req.user._id;
    if (req.query.status && isValidStatus(req.query.status)) filter.status = req.query.status;

    const requests = await Request.find(filter)
      .populate("user", "name email studentId departmentCode year role")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ requests });
  } catch (err) {
    next(err);
  }
}

/** GET /api/requests/:id — request + activity history (ownership enforced). */
export async function getRequest(req, res, next) {
  try {
    const request = await findRequest(req.params.id)
      .populate("user", "name email studentId departmentCode year role")
      .populate("assignedStaff", "name");
    if (!request) throw new ApiError(404, "Request not found.");

    if (req.user.role === "student" && String(request.user._id) !== String(req.user._id)) {
      throw new ApiError(403, "You can only view your own requests.");
    }

    const activity = await RequestActivity.find({ request: request._id })
      .populate("actor", "name role")
      .sort({ createdAt: 1 })
      .lean();

    res.json({ request, activity });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/requests/:id/status — drive the workflow.
 * Body: { action, comment?, purpose?, notes?, formData? }
 * Enforces valid transitions and role permissions server-side.
 */
export async function updateStatus(req, res, next) {
  try {
    const { action, comment } = req.body;
    if (!action || !ACTION_TO_STATUS[action]) {
      throw new ApiError(400, `Unknown action. Use one of: ${Object.keys(ACTION_TO_STATUS).join(", ")}.`);
    }
    if (action === "request_changes" && !String(comment || "").trim()) {
      throw new ApiError(400, "Please add a comment explaining what the student needs to change.");
    }

    const request = await findRequest(req.params.id);
    if (!request) throw new ApiError(404, "Request not found.");

    const role = req.user.role;
    const studentActions = ["submit", "resubmit", "save_draft"];

    if (studentActions.includes(action)) {
      if (role === "student" && String(request.user) !== String(req.user._id)) {
        throw new ApiError(403, "You can only act on your own requests.");
      }
    } else if (role === "student") {
      throw new ApiError(403, "Only staff can review requests.");
    }

    const from = request.status;
    const to = ACTION_TO_STATUS[action];
    if (!canTransition(from, to, role)) {
      throw new ApiError(409, `This request can't move from "${STAGE_LABELS[from]}" to "${STAGE_LABELS[to]}".`);
    }

    const previousStatus = from;
    request.status = to;
    request.stage = STAGE_LABELS[to];

    if (to === STATUS.APPROVED) {
      request.approvedAt = new Date();
      if (!request.expectedCompletion) request.expectedCompletion = new Date();
    }
    if (action === "start_review" && !request.assignedStaff) {
      request.assignedStaff = req.user._id;
    }
    if (action === "request_changes") {
      request.reviewComment = String(comment).trim();
    }

    // Students may update their answers when submitting / resubmitting / saving.
    if (studentActions.includes(action)) {
      const { purpose, notes, formData } = req.body;
      if (purpose !== undefined) request.purpose = String(purpose || "").trim();
      if (notes !== undefined) request.notes = String(notes || "").trim();
      if (formData !== undefined) request.formData = formData;
      if (to === STATUS.SUBMITTED) {
        request.submittedAt = new Date();
        request.expectedCompletion = addDays(new Date(), 5);
        request.reviewComment = "";
      }
    }

    await request.save();

    await RequestActivity.create({
      request: request._id,
      actor: req.user._id,
      actorName: req.user.name,
      action,
      previousStatus,
      newStatus: to,
      comment: String(comment || "").trim(),
    });

    res.json({ request });
  } catch (err) {
    next(err);
  }
}
