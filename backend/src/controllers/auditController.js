import db from "../config/db.js";

// Ensure table exists
export const createAuditTable = () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            username VARCHAR(255),
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_ID) ON DELETE SET NULL
        )
    `;
    db.query(sql, (err) => {
        if (err) console.error("Error creating audit_logs table:", err);
        else console.log("Audit logs table ready");
    });
};

// Log an action
export const logAction = (userId, username, action, details, req) => {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    const sql = "INSERT INTO audit_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [userId, username, action, details, ip], (err) => {
        if (err) console.error("Error logging action:", err);
    });
};

// Get logs (Admin only)
export const getLogs = (req, res) => {
    const limit = 50;
    const sql = "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?";
    db.query(sql, [limit], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        res.json(results);
    });
};
