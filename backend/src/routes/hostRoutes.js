import express from "express";
import {
  getAllHosts,
  addHost,
  deleteHost,
} from "../controllers/hostController.js";

const router = express.Router();

// Get all hosts
router.get("/get-all", getAllHosts);

// Add a new host
router.post("/add", addHost);

// Delete a host by ID
router.delete("/:host_ID", deleteHost);


export default router;
