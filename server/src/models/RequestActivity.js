import mongoose from "mongoose";

/**
 * Append-only audit trail for a request. Every workflow action creates a row so
 * the full history (who did what, when, with what comment) is reconstructable.
 */
const requestActivitySchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, default: "" },
    action: { type: String, required: true }, // created, submitted, approved, rejected, requested_changes, resubmitted, commented
    previousStatus: { type: String, default: "" },
    newStatus: { type: String, default: "" },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

export const RequestActivity = mongoose.model("RequestActivity", requestActivitySchema);
