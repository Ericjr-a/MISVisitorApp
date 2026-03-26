import db from "../config/db.js";

export const logNewCall = (req, res) => {
  const {
    host_ID,
    is_staff,
    caller_firstname,
    caller_lastname,
    call_duration,
    purpose,
    contact,
    call_type,
  } = req.body;

  if (
    !host_ID ||
    is_staff === undefined ||
    !caller_firstname ||
    !caller_lastname ||
    !purpose ||
    !contact ||
    !call_type
  ) {
    return res
      .status(400)
      .json({ message: "Missing required call information" });
  }

  const sql = `
    INSERT INTO call_logs (
      host_ID, is_staff, caller_firstname, caller_lastname,
      call_duration, purpose, contact, call_type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      host_ID,
      is_staff,
      caller_firstname,
      caller_lastname,
      call_duration || null,
      purpose,
      contact,
      call_type,
    ],
    (err, result) => {
      if (err) {
        console.error("Error logging call:", err);
        return res
          .status(500)
          .json({ message: "Database error", error: err.message });
      }

      res.status(201).json({
        message: "Call logged successfully",
        call_log_ID: result.insertId,
      });
    }
  );
};

//Get all call logs
export const getAllCalls = (req, res) => {
  const { search, startDate, endDate, callType } = req.query;
  let queryParams = [];
  let conditions = [];

  let sql = `
    SELECT 
      c.call_log_ID,
      c.caller_firstname,
      c.caller_lastname,
      c.call_time,
      c.call_duration,
      c.purpose,
      c.contact,
      c.call_type,
      CASE 
        WHEN c.is_staff = 1 THEN s.staff_name 
        ELSE n.nonstaff_name 
      END AS host_name,
      CASE 
        WHEN c.is_staff = 1 THEN s.staff_department 
        ELSE n.nonstaff_department 
      END AS department
    FROM call_logs c
    LEFT JOIN staff s ON c.host_ID = s.id AND c.is_staff = 1
    LEFT JOIN nonstaff n ON c.host_ID = n.nonstaff_ID AND c.is_staff = 0
  `;

  if (search) {
    const term = `%${search}%`;
    conditions.push(`(
      c.caller_firstname LIKE ? OR
      c.caller_lastname LIKE ? OR
      c.purpose LIKE ? OR
      c.contact LIKE ?
    )`);
    queryParams.push(term, term, term, term);
  }

  if (startDate) {
    conditions.push(`c.call_time >= ?`);
    queryParams.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    conditions.push(`c.call_time <= ?`);
    queryParams.push(`${endDate} 23:59:59`);
  }

  if (callType && callType !== 'all') {
    conditions.push(`c.call_type = ?`);
    queryParams.push(callType);
  }

  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }

  sql += ` ORDER BY c.call_time DESC`;

  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching calls:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    res.status(200).json(results);
  });
};

//get single call by ID
export const getCallById = (req, res) => {
  const { id } = req.params;

  const sql = `
      SELECT 
        c.call_log_ID,
        c.caller_firstname,
        c.caller_lastname,
        c.call_time,
        c.call_duration,
        c.purpose,
        c.contact,
        CASE 
          WHEN c.is_staff = 1 THEN s.staff_name 
          ELSE n.nonstaff_name 
        END AS host_name,
        CASE 
          WHEN c.is_staff = 1 THEN s.staff_department 
          ELSE n.nonstaff_department 
        END AS department
      FROM call_logs c
      LEFT JOIN staff s ON c.host_ID = s.id AND c.is_staff = 1
      LEFT JOIN nonstaff n ON c.host_ID = n.nonstaff_ID AND c.is_staff = 0
      WHERE c.call_log_ID = ?
    `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching call:", err);
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Call log not found" });
    }

    res.status(200).json(results[0]);
  });
};

//delete call logs
export const deleteCall = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM call_logs WHERE call_log_ID = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting call:", err);
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Call log not found" });
    }

    res.status(200).json({ message: "Call log deleted successfully" });
  });
};
