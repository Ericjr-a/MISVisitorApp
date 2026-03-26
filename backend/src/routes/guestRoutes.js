import express from "express";
import {
  addGuest,
  deleteGuest,
  getGuests,
} from "../controllers/guestController.js";

const router = express.Router();

// Route to add a new guest
router.post("/add", addGuest);

// Route to get all guests
router.get("/get", getGuests);

//Route to delete guest by id
router.delete("/delete/:guest_ID", deleteGuest);

export default router;
