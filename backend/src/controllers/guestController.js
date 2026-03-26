import db from "../config/db.js";

// Add a guest
export const addGuest = (req, res) => {
  const { guest_firstname, guest_lastname, guest_phonenumber } = req.body;

  if (!guest_firstname || !guest_lastname || !guest_phonenumber) {
    return res.status(400).json({ message: "Missing guest info" });
  }

  const sql =
    "INSERT INTO guest (guest_firstname, guest_lastname, guest_phonenumber) VALUES (?, ?, ?)";
  db.query(
    sql,
    [guest_firstname, guest_lastname, guest_phonenumber],
    (err, result) => {
      if (err) {
        console.error(" Error inserting guest:", err);
        return res
          .status(500)
          .json({ message: "Database error", error: err.message });
      }
      res.status(201).json({
        message: "Guest added successfully",
        guest_ID: result.insertId,
      });
    }
  );
};

// Get all guests
export const getGuests = (req, res) => {
  const sql = "SELECT * FROM guest";
  db.query(sql, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    res.status(200).json(results);
  });
};

export const deleteGuest = (req, res) => {
  const { guest_ID } = req.params;

  if (!guest_ID) {
    return res.status(400).json({ message: "Guest ID is required" });
  }

  const sql = `DELETE FROM guest WHERE guest_ID = ?`;
  db.query(sql, [guest_ID], (err, result) => {
    if (err) {
      console.error("Error deleting guest:", err);
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Guest not found" });
    }

    res
      .status(200)
      .json({ message: "Guest and related logs deleted successfully" });
  });
};
