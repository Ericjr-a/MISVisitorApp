import express from "express";
import { getReports, getDashboardStats, exportReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/", getReports);
router.get("/dashboard", getDashboardStats);
router.get("/export", exportReport);

export default router;
