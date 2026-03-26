import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import {
  logNewVisitor,
  getVisitorLogs,
  getNextBadgeNumber,
  deleteVisitor,
  checkOutVisitor,
  getVisitorById,
  searchGuests,
  updateVisitor,
} from "../controllers/visitorController.js";

const router = express.Router();

router.get("/get-visitors", authenticateToken, getVisitorLogs);
router.get("/search-guests", authenticateToken, searchGuests);
router.post("/new-visitor", authenticateToken, logNewVisitor);
router.delete("/delete/:id", authenticateToken, requireAdmin, deleteVisitor);
router.get("/next-badge", authenticateToken, getNextBadgeNumber);
router.put("/checkout/:id", authenticateToken, checkOutVisitor);
router.put("/:id", authenticateToken, updateVisitor);
router.get("/:id", authenticateToken, getVisitorById);

export default router;