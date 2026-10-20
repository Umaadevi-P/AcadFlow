import mongoose from "mongoose";

/**
 * A student's request for an academic document, plus its current workflow state.
 * Denormalised document fields (name/slug/icon/tone) are copied at creation time
 * so request cards render correctly even if a document is later edited.
 */
const requestSchema = new mongoose.Schema(
  {
    // Human-friendly identifier, e.g. "AF-2048".
    requestId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },

    documentName: { type: String, required: true },
    documentSlug: { type: String, required: true },
    documentIcon: { type: String, default: "file" },
    documentTone: { type: String, default: "lilac" },

    purpose: { type: String, default: "" }, // e.g. "Visa application"
    notes: { type: String, default: "" }, // free-text "anything else"
    // The per-document required fields the student filled, keyed by field name.
    formData: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected", "correction_required"],
      default: "submitted",
      index: true,
    },
    stage: { type: String, default: "Submitted" }, // current stage label
    submittedAt: { type: Date, default: Date.now },
    expectedCompletion: { type: Date },
    approvedAt: { type: Date },

    assignedDepartment: { type: String, default: "Academic Office" },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Latest staff comment — shown to the student when correction is requested.
    reviewComment: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Request = mongoose.model("Request", requestSchema);
