import { Router } from "express";
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
} from "../controllers/documentController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Catalog browse + search (authenticated for this prototype).
router.get("/", requireAuth, listDocuments);
router.get("/:slug", requireAuth, getDocument);

// Document configuration — administrators only.
router.post("/", requireAuth, requireRole("admin"), createDocument);
router.patch("/:id", requireAuth, requireRole("admin"), updateDocument);

export default router;
