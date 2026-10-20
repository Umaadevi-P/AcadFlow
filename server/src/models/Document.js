import mongoose from "mongoose";

// A single "already available / required" item shown on a document page.
const requirementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ready: { type: Boolean, default: false },
    icon: { type: String, default: "file" },
  },
  { _id: false },
);

// A step in the "How it works" workflow strip.
const workflowStepSchema = new mongoose.Schema(
  {
    number: String,
    title: String,
    description: String,
    icon: { type: String, default: "file" },
    tone: String,
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // URL-friendly identifier used in routes: /documents/:slug
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    short: { type: String, required: true }, // one-line summary on cards
    description: { type: String, default: "" }, // longer paragraph on details page
    category: { type: String, required: true },
    // Visible purpose tags (e.g. "Visa", "Bank Loan").
    tags: { type: [String], default: [] },
    // Lowercase keywords used for purpose-based search matching.
    purposes: { type: [String], default: [] },
    status: { type: String, default: "Available to you" }, // display label
    icon: { type: String, default: "file" },
    tone: { type: String, default: "lilac" },

    // Detail-page meta cards.
    fee: { type: String, default: "₹ Free" },
    feeNote: { type: String, default: "No application fee" },
    delivery: { type: String, default: "Digital" },
    deliveryNote: { type: String, default: "Delivery to your account" },
    processingTime: { type: String, default: "1–2 days" },
    processingNote: { type: String, default: "Working days" },
    audience: { type: String, default: "Students" },
    audienceNote: { type: String, default: "Currently enrolled" },

    eligibility: { type: [String], default: [] },
    requirements: { type: [requirementSchema], default: [] },
    uses: { type: String, default: "" }, // "What is it used for?" paragraph
    useTags: { type: [String], default: [] }, // coloured chips under the uses paragraph

    workflow: { type: [workflowStepSchema], default: [] },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Document = mongoose.model("Document", documentSchema);
