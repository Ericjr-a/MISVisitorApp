import db from "../config/db.js";

//Generate badgenumber
//Generate badgenumber (Daily Reset Logic)
//Generate badgenumber (Daily Reset Logic - Native SQL Date)
const generateBadgeNumber = (callback) => {
  console.log("Generating badge number... Checking for TODAY's records.");

  const sql = `
    SELECT badge_number
    FROM visitor_log
    WHERE DATE(check_in_time) = CURDATE()
    ORDER BY visitorLog_ID DESC
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error generating badge number:", err);
      return callback(err);
    }

    let nextNumber = 1;

    if (results.length > 0 && results[0].badge_number) {
      const lastBadge = results[0].badge_number;
      const match = lastBadge.match(/\d+/);

      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    const newBadge = `V${String(nextNumber).padStart(3, "0")}`;
    callback(null, newBadge);
  });
};

// Log a new visitor
export const logNewVisitor = (req, res) => {
  const {
    guest_firstname,
    guest_lastname,
    guest_phonenumber,
    host_ID,
    is_staff,
    visit_purpose,
  } = req.body;

  if (
    !guest_firstname ||
    !guest_lastname ||
    !guest_phonenumber ||
    !host_ID ||
    is_staff === undefined ||
    !visit_purpose
  ) {
    return res.status(400).json({ message: "Missing required visitor information" });
  }

  if (!/^\d{10}$/.test(guest_phonenumber)) {
    return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
  }

  const insertGuestSQL = `
    INSERT INTO guest (guest_firstname, guest_lastname, guest_phonenumber)
    VALUES (?, ?, ?)
  `;

  const guestValues = [guest_firstname, guest_lastname, guest_phonenumber];

  db.query(insertGuestSQL, guestValues, (guestErr, guestResult) => {
    if (guestErr) {
      console.error("Error adding guest:", guestErr);
      return res
        .status(500)
        .json({ message: "Database error", error: guestErr.message });
    }

    const guest_ID = guestResult.insertId;

    // Step  Generate a unique badge number
    generateBadgeNumber((badgeErr, badge_number) => {
      if (badgeErr) {
        console.error("Error generating badge number:", badgeErr);
        return res.status(500).json({
          message: "Badge generation failed",
          error: badgeErr.message,
        });
      }

      // Insert the visitor log
      const insertLogSQL = `
        INSERT INTO visitor_log (guest_ID, host_ID, is_staff, badge_number, visit_purpose)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        insertLogSQL,
        [guest_ID, host_ID, is_staff, badge_number, visit_purpose || null],
        (logErr, logResult) => {
          if (logErr) {
            console.error("Error creating visitor log:", logErr);
            return res.status(500).json({
              message: "Error creating visitor log",
              error: logErr.message,
            });
          }

          res.status(201).json({
            message: "Visitor logged and checked in successfully",
            visitorLog_ID: logResult.insertId,
            guest_ID,
            badge_number,
          });
        }
      );
    });
  });
};

// Get all visitor logs with pagination
export const getVisitorLogs = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const activeOnly = req.query.active === 'true';

  // Determine WHERE clause
  let conditions = [];
  let queryParams = [];
  let countParams = [];

  if (activeOnly) {
    conditions.push("v.check_out_time IS NULL");
  }

  // Add Search Condition
  if (req.query.search) {
    const searchTerm = `%${req.query.search.trim()}%`;
    conditions.push(`(
        g.guest_firstname LIKE ? OR 
        g.guest_lastname LIKE ? OR 
        v.badge_number LIKE ? OR
        v.visit_purpose LIKE ? OR
        (v.is_staff = 1 AND s.staff_name LIKE ?) OR
        (v.is_staff = 0 AND n.nonstaff_name LIKE ?)
    )`);
    // Parameters for the count query
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    // Parameters for the main query
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  let whereClause = "";
  if (conditions.length > 0) {
    whereClause = "WHERE " + conditions.join(" AND ");
  }

  const countSql = `
    SELECT COUNT(*) as total 
    FROM visitor_log v
    LEFT JOIN guest g ON v.guest_ID = g.guest_ID
    LEFT JOIN staff s ON v.host_ID = s.id AND v.is_staff = 1
    LEFT JOIN nonstaff n ON v.host_ID = n.nonstaff_ID AND v.is_staff = 0
    ${whereClause}
  `;

  const sql = `
    SELECT
      v.visitorLog_ID,
      g.guest_firstname,
      g.guest_lastname,
      CASE 
        WHEN v.is_staff = 1 THEN s.staff_name 
        ELSE n.nonstaff_name 
      END AS host_name,
      v.badge_number,
      v.visit_purpose,
      v.check_in_time,
      v.check_out_time,
      v.is_edited,
      v.updated_at
    FROM visitor_log v
    LEFT JOIN guest g ON v.guest_ID = g.guest_ID
    LEFT JOIN staff s ON v.host_ID = s.id AND v.is_staff = 1
    LEFT JOIN nonstaff n ON v.host_ID = n.nonstaff_ID AND v.is_staff = 0
    ${whereClause}
    ORDER BY v.check_in_time DESC
    LIMIT ? OFFSET ?;
  `;



  // Add limit and offset to main query parameters
  queryParams.push(limit, offset);

  db.query(countSql, countParams, (countErr, countResult) => {
    if (countErr) {
      console.error("Error counting logs:", countErr);
      return res.status(500).json({ message: "Database error", error: countErr.message });
    }

    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);

    db.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching logs:", err);
        return res.status(500).json({ message: "Database error", error: err.message });
      }
      res.status(200).json({
        data: results,
        total,
        page,
        pages,
        limit
      });
    });
  });
};

// Update a visitor log
export const updateVisitor = (req, res) => {
  const { id } = req.params;
  const {
    guest_firstname,
    guest_lastname,
    guest_phonenumber,
    host_ID,
    is_staff,
    visit_purpose,
  } = req.body;

  if (!id) return res.status(400).json({ message: "Visitor Log ID required" });

  // 1. Get the guest_ID from the visitor_log
  const getSql = "SELECT guest_ID FROM visitor_log WHERE visitorLog_ID = ?";
  db.query(getSql, [id], (err, results) => {
    if (err) {
      console.error("Error finding log:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    const guest_ID = results[0].guest_ID;

    // 2. Update guest details
    const updateGuestSql = `
      UPDATE guest 
      SET guest_firstname = ?, guest_lastname = ?, guest_phonenumber = ?
      WHERE guest_ID = ?
    `;

    db.query(updateGuestSql, [guest_firstname, guest_lastname, guest_phonenumber, guest_ID], (updateGuestErr) => {
      if (updateGuestErr) {
        console.error("Error updating guest:", updateGuestErr);
        return res.status(500).json({ message: "Database error", error: updateGuestErr.message });
      }

      // 3. Update visitor log details
      const updateLogSql = `
      UPDATE visitor_log
      SET host_ID = ?, is_staff = ?, visit_purpose = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP
      WHERE visitorLog_ID = ?
    `;

      db.query(updateLogSql, [host_ID, is_staff, visit_purpose, id], (updateLogErr) => {
        if (updateLogErr) {
          console.error("Error updating log:", updateLogErr);
          return res.status(500).json({ message: "Database error", error: updateLogErr.message });
        }

        res.json({ message: "Visitor updated successfully" });
      });
    });
  });
};

//delete visitor log
export const deleteVisitor = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM visitor_log WHERE visitorLog_ID = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting call:", err);
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visitor log not found" });
    }

    res.status(200).json({ message: "Visitor log deleted successfully" });
  });
};

// Generate and return next badge number
// Generate and return next badge number (Daily Reset Logic)
// Generate and return next badge number (Daily Reset Logic - Native SQL Date)
export const getNextBadgeNumber = (req, res) => {
  // Use MySQL's CURDATE() for consistency
  const sql = `
    SELECT badge_number 
    FROM visitor_log 
    WHERE DATE(check_in_time) = CURDATE() 
    ORDER BY visitorLog_ID DESC 
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching last badge number:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    let newBadge = "V001";
    if (results.length > 0 && results[0].badge_number) {
      const lastBadge = results[0].badge_number;
      // Extract number part
      const lastNumber = parseInt(lastBadge.replace("V", ""), 10);

      if (!isNaN(lastNumber)) {
        const nextNumber = lastNumber + 1;
        newBadge = `V${nextNumber.toString().padStart(3, "0")}`;
      }
    }

    res.status(200).json({ badge_number: newBadge });
  });
};

// Check out a visitor
export const checkOutVisitor = (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Visitor Log ID is required" });
  }

  const sql = `
    UPDATE visitor_log 
    SET check_out_time = CURRENT_TIMESTAMP,
        checkout_notes = ?
    WHERE visitorLog_ID = ? AND check_out_time IS NULL
  `;

  db.query(sql, [notes || null, id], (err, result) => {
    if (err) {
      console.error("Error checking out visitor:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visitor log not found or already checked out" });
    }

    res.status(200).json({ message: "Visitor checked out successfully" });
  });
};


// Get visitor by ID
export const getVisitorById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      vl.visitorLog_ID,
      vl.guest_ID,
      vl.host_ID,
      vl.badge_number,
      vl.visit_purpose,
      vl.check_in_time,
      vl.check_out_time,
      g.guest_firstname,
      g.guest_lastname,
      g.guest_phonenumber,
      CASE 
        WHEN vl.is_staff = 1 THEN s.staff_name 
        ELSE n.nonstaff_name 
      END AS host_name
    FROM visitor_log vl
    JOIN guest g ON vl.guest_ID = g.guest_ID
    LEFT JOIN staff s ON vl.host_ID = s.id AND vl.is_staff = 1
    LEFT JOIN nonstaff n ON vl.host_ID = n.nonstaff_ID AND vl.is_staff = 0
    WHERE vl.visitorLog_ID = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching visitor:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Visitor log not found" });
    }
    res.json(results[0]);
  });
};

// Search guests by name or phone
export const searchGuests = (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  const searchTerm = `%${q.trim()}%`;
  const sql = `
    SELECT DISTINCT guest_ID, guest_firstname, guest_lastname, guest_phonenumber
    FROM guest
    WHERE guest_firstname LIKE ? 
       OR guest_lastname LIKE ? 
       OR guest_phonenumber LIKE ?
    LIMIT 10
  `;

  db.query(sql, [searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error("Error searching guests:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
};
