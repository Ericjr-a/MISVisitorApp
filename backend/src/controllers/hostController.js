import db from "../config/db.js";

//Get all hosts

export const getAllHosts = (req, res) => {
  const baseSql = `
    SELECT 
      s.id AS host_ID, 
      s.staff_name AS host_name, 
      s.staff_phoneNumber AS host_phoneNumber, 
      s.staff_department AS department, 
      pb.avaya_directory AS avaya_directory,
      'Staff' AS host_type 
    FROM staff s
    LEFT JOIN phonebook pb ON s.id = pb.staff_ID
    UNION
    SELECT 
      nonstaff_ID AS host_ID, 
      nonstaff_name AS host_name, 
      nonstaff_phonenumber AS host_phoneNumber, 
      nonstaff_department AS department, 
      NULL AS avaya_directory,
      'Nonstaff' AS host_type 
    FROM nonstaff
  `;

  // Check if pagination or search is requested
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : null;

  // Use a subquery strategy or a WHERE wrapper for clean filtering on the UNION
  // But strictly speaking, we can just wrap the UNION in a SELECT * FROM (...) AS combined WHERE ...

  let wrapperSql = `SELECT * FROM (${baseSql}) AS combined`;
  let whereClause = "";
  let queryParams = [];

  if (search) {
    const term = `%${search}%`;
    whereClause = "WHERE combined.host_name LIKE ? OR combined.department LIKE ? OR combined.host_phoneNumber LIKE ?";
    queryParams.push(term, term, term);
  }

  // Count Query
  const countSql = `SELECT COUNT(*) as total FROM (${baseSql}) AS combined ${whereClause}`;

  // Main Query
  const finalSql = `SELECT * FROM (${baseSql}) AS combined ${whereClause} ORDER BY combined.host_name ASC LIMIT ? OFFSET ?`;

  // We only run the paginated path if page/limit is explicit OR if search is active (usually want pagination with search)
  // For dropdowns (no page/limit), we usually just want all or top N. 
  // If user passed no page/limit but PASSED search, we should probably return all matches or top matches. 
  // Let's stick to existing logic: if page/limit OR search is present, use pagination structure. 

  if (req.query.page || req.query.limit || search) {
    db.query(countSql, queryParams, (countErr, countResult) => {
      if (countErr) {
        console.error("Error counting hosts:", countErr);
        return res.status(500).json({ message: "Database error", error: countErr.message });
      }

      const total = countResult[0].total;
      const pages = Math.ceil(total / limit);

      // Add pagination params
      queryParams.push(limit, offset);

      db.query(finalSql, queryParams, (err, results) => {
        if (err) {
          console.error("Error fetching hosts:", err);
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
  } else {
    // Legacy / Dropdown behavior (No pagination, no search) -> Return all
    const sql = `${baseSql} ORDER BY host_name ASC`;
    db.query(sql, (err, results) => {
      if (err) {
        console.error(" Error fetching hosts:", err);
        return res.status(500).json({ message: "Database error", error: err.message });
      }
      res.status(200).json(results);
    });
  }
};

//Add new host 
export const addHost = (req, res) => {
  const { type, name, phoneNumber, department, staff_id } = req.body;

  if (!type || !name || !phoneNumber) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!["staff", "nonstaff"].includes(type.toLowerCase())) {
    return res
      .status(400)
      .json({ message: "Invalid host type (must be staff or nonstaff)" });
  }

  // Determine target table based on host type
  const isStaff = type.toLowerCase() === "staff";
  const table = isStaff ? "staff" : "nonstaff";
  const nameField = isStaff ? "staff_name" : "nonstaff_name";
  const phoneField = isStaff ? "staff_phoneNumber" : "nonstaff_phonenumber";
  const deptField = isStaff ? "staff_department" : "nonstaff_department";

  if (isStaff && !staff_id) {
    return res.status(400).json({ message: "Staff ID is required for staff members" });
  }

  // Insert into staff/nonstaff
  let insertPersonSQL;
  let queryValues;

  if (isStaff) {
    insertPersonSQL = `
      INSERT INTO staff (staff_id, staff_name, staff_phoneNumber, staff_department)
      VALUES (?, ?, ?, ?)
    `;
    queryValues = [staff_id, name, phoneNumber, department || null];
  } else {
    insertPersonSQL = `
      INSERT INTO nonstaff (nonstaff_name, nonstaff_phonenumber, nonstaff_department)
      VALUES (?, ?, ?)
    `;
    queryValues = [name, phoneNumber, department || null];
  }

  db.query(
    insertPersonSQL,
    queryValues,
    (insertErr, insertResult) => {
      if (insertErr) {
        console.error(` Error adding ${type}:`, insertErr);
        return res
          .status(500)
          .json({ message: "Database error", error: insertErr.message });
      }

      res.status(201).json({ message: ` ${type} host added successfully.` });
    }
  );
};


// delete host (removes from staff or nonstaff)
export const deleteHost = (req, res) => {
  const { host_ID } = req.params;
  const { type } = req.query; // Expect type as query param: ?type=staff or ?type=nonstaff

  if (!host_ID) return res.status(400).json({ message: "Host ID is required" });
  if (!type || !["staff", "nonstaff"].includes(type.toLowerCase())) {
    return res.status(400).json({ message: "Valid host type (staff/nonstaff) is required" });
  }

  const table = type.toLowerCase() === "staff" ? "staff" : "nonstaff";
  const idField = type.toLowerCase() === "staff" ? "id" : "nonstaff_ID";

  const sql = `DELETE FROM ${table} WHERE ${idField} = ?`;

  db.query(sql, [host_ID], (err, result) => {
    if (err) {
      console.error(" Error deleting host:", err);
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Host not found" });
    }

    res.status(200).json({ message: "Host deleted successfully" });
  });
};
