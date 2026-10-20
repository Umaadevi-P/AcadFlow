import { Document } from "../models/Document.js";
import { ApiError } from "../middleware/errorHandler.js";

// Escape regex metacharacters so user search input can't break the query.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Map common purpose phrasings to the keywords the catalog actually stores.
function normalizeQuery(q) {
  let s = String(q || "").toLowerCase();
  s = s.replace(/master(?:'s|’s)?|abroad|university applications?/g, " higher studies ");
  s = s.replace(/education loan/g, " bank loan ");
  return s;
}

// Short, common words we don't want to match against.
const STOPWORDS = new Set([
  "need", "document", "documents", "application", "applying", "with", "from",
  "about", "your", "have", "for", "the", "my", "and", "want", "help", "get",
]);

function searchTerms(q) {
  const normalized = normalizeQuery(q);
  const words = normalized.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return [...new Set(words)];
}

/**
 * GET /api/documents?q=&category=
 * Search across name, short, category, tags and purposes; filter by category.
 */
export async function listDocuments(req, res, next) {
  try {
    const { q = "", category = "All" } = req.query;
    const filter = { active: true };
    if (category && category !== "All") filter.category = category;

    const terms = searchTerms(q);
    if (terms.length) {
      filter.$or = terms.flatMap((term) => {
        const re = new RegExp(escapeRegex(term), "i");
        return [
          { name: re },
          { short: re },
          { category: re },
          { tags: re },
          { purposes: re },
        ];
      });
    }

    const documents = await Document.find(filter).sort({ order: 1, name: 1 });
    res.json({ documents, count: documents.length });
  } catch (err) {
    next(err);
  }
}

/** GET /api/documents/:slug → { document } */
export async function getDocument(req, res, next) {
  try {
    const document = await Document.findOne({ slug: String(req.params.slug).toLowerCase(), active: true });
    if (!document) throw new ApiError(404, "Document not found.");
    res.json({ document });
  } catch (err) {
    next(err);
  }
}

// Fields an administrator may set when creating/editing a document.
const EDITABLE = [
  "name", "slug", "short", "description", "category", "tags", "purposes",
  "status", "icon", "tone", "fee", "feeNote", "delivery", "deliveryNote",
  "processingTime", "processingNote", "audience", "audienceNote", "eligibility",
  "requirements", "uses", "useTags", "workflow", "active", "order",
];

/** POST /api/documents  (admin only) */
export async function createDocument(req, res, next) {
  try {
    const body = {};
    for (const key of EDITABLE) if (req.body[key] !== undefined) body[key] = req.body[key];
    if (!body.name || !body.slug || !body.short) {
      throw new ApiError(400, "name, slug and short are required.");
    }
    const document = await Document.create(body);
    res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/documents/:id  (admin only) */
export async function updateDocument(req, res, next) {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) throw new ApiError(404, "Document not found.");
    for (const key of EDITABLE) if (req.body[key] !== undefined) document[key] = req.body[key];
    await document.save();
    res.json({ document });
  } catch (err) {
    next(err);
  }
}
