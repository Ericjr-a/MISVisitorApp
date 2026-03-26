import express from "express";
import {
  logNewCall,
  getAllCalls,
  getCallById,
  deleteCall,
} from "../controllers/callerController.js";

const router = express.Router();

// Create a new call log
router.post("/add", logNewCall);

// Get all call logs
router.get("/getall", getAllCalls);

// Get a single call log by ID
router.get("/:id", getCallById);

// Delete a call log
router.delete("/delete/:id", deleteCall);

export default router;
