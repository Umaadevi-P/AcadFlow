import { Router } from "express";
import {
  createRequest,
  listRequests,
  getRequest,
  updateStatus,
} from "../controllers/requestController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All request routes require authentication; ownership/role is enforced inside.
router.get("/", requireAuth, listRequests);
router.get("/:id", requireAuth, getRequest);
router.post("/", requireAuth, createRequest);
router.patch("/:id/status", requireAuth, updateStatus);

export default router;
