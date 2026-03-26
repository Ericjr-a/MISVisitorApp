import db from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const addUser = (req, res) => {
    const { username, email, passwordd, role_name } = req.body;
    const saltRounds = 10;

    if (!username || !email || !passwordd || !role_name) {
        return res
            .status(400)
            .json({ message: "Username, email, password, and role are required" });
    }

    // Hash password
    bcrypt.hash(passwordd.toString(), saltRounds, (err, hash) => {
        if (err) {
            console.error(" Error hashing password:", err);
            return res.status(500).json({ message: "Error hashing password" });
        }

        const sql = `
        INSERT INTO users (username, email, passwordd, role_name, must_change_password)
        VALUES (?, ?, ?, ?, 1)
      `;

        const values = [username, email, hash, role_name];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error(" Database error:", err);
                return res
                    .status(500)
                    .json({ message: "Database error", error: err.message });
            }

            return res.status(201).json({
                message: "User created successfully!",
                user_ID: result.insertId,
            });
        });
    });
};

export const loginUser = async (req, res) => {
    const { email, passwordd } = req.body;

    if (!email || !passwordd) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const sql = "SELECT * FROM users WHERE email = ?";
        db.query(sql, [email], async (err, result) => {
            if (err)
                return res
                    .status(500)
                    .json({ message: "Database error", error: err.message });
            if (result.length === 0)
                return res.status(401).json({ message: "Invalid credentials" });

            const user = result[0];
            const match = await bcrypt.compare(passwordd, user.passwordd);

            if (!match) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Successful login
            const token = jwt.sign(
                {
                    user_ID: user.user_ID,
                    username: user.username,
                    email: user.email,
                    role_name: user.role_name
                },
                process.env.JWT_SECRET || "your_jwt_secret",
                { expiresIn: "1d" }
            );



            res.status(200).json({
                message: "Login successful",
                token: token,
                user_ID: user.user_ID,
                username: user.username,
                email: user.email,
                role_name: user.role_name,
                must_change_password: user.must_change_password,
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const requestPasswordReset = (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0)
            return res.status(404).json({ message: "User not found" });

        //generate a reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const updateSql =
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?";
        db.query(updateSql, [resetToken, expiry, email], (updateErr) => {
            if (updateErr)
                return res.status(500).json({ message: "Error saving token" });

            // For now, just send the token back (replace with email later)
        });
    });
};

export const resetPassword = (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res
            .status(400)
            .json({ message: "Token and new password are required" });
    }

    const sql = "SELECT * FROM users WHERE reset_token = ?";
    db.query(sql, [token], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0)
            return res.status(400).json({ message: "Invalid or expired token" });

        const user = result[0];
        const now = new Date();

        if (now > new Date(user.reset_token_expires)) {
            return res.status(400).json({ message: "Token expired" });
        }

        // Hash the new password
        const saltRounds = 10;
        bcrypt.hash(newPassword, saltRounds, (hashErr, hash) => {
            if (hashErr)
                return res.status(500).json({ message: "Error hashing password" });

            const updateSql = `
        UPDATE users
        SET passwordd = ?, reset_token = NULL, reset_token_expires = NULL
        WHERE user_ID = ?`;
            db.query(updateSql, [hash, user.user_ID], (updateErr) => {
                if (updateErr)
                    return res.status(500).json({ message: "Error updating password" });
                res
                    .status(200)
                    .json({ message: "Password has been reset successfully" });
            });
        });
    });
};

export const getUsers = (req, res) => {
    const sql = "SELECT user_ID, username, email, role_name, created_at FROM users";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res
                .status(500)
                .json({ message: "Database error", error: err.message });
        }
        res.status(200).json(results);
    });
};

export const updateUserRole = (req, res) => {
    const { user_ID, role_name } = req.body;

    if (!user_ID || !role_name) {
        return res.status(400).json({ message: "User ID and role are required" });
    }

    const sql = "UPDATE users SET role_name = ? WHERE user_ID = ?";
    db.query(sql, [role_name, user_ID], (err, result) => {
        if (err) {
            console.error("Error updating user role:", err);
            return res
                .status(500)
                .json({ message: "Database error", error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User role updated successfully" });
    });
};

export const deleteUser = (req, res) => {
    const { user_ID } = req.params;

    if (!user_ID) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const sql = "DELETE FROM users WHERE user_ID = ?";
    db.query(sql, [user_ID], (err, result) => {
        if (err) {
            console.error("Error deleting user:", err);
            return res
                .status(500)
                .json({ message: "Database error", error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    });
};

export const changePassword = (req, res) => {
    const user_ID = req.user.user_ID;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
    }

    const sql = "SELECT passwordd FROM users WHERE user_ID = ?";

    db.query(sql, [user_ID], async (err, results) => {
        if (err) {
            console.error("Error fetching user password:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const storedHashedPassword = results[0].passwordd;

        const isMatch = await bcrypt.compare(currentPassword, storedHashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different from current password" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updateSql = "UPDATE users SET passwordd = ? WHERE user_ID = ?";
        db.query(updateSql, [hashedNewPassword, user_ID], (updateErr) => {
            if (updateErr) {
                console.error("Error updating password:", updateErr);
                return res.status(500).json({ message: "Failed to update password" });
            }

            res.status(200).json({ message: "Password changed successfully" });
        });
    });
};
export const updateUser = (req, res) => {
    const { user_ID } = req.params;
    const { username, email, role_name, passwordd } = req.body;

    if (!username || !email || !role_name) {
        return res.status(400).json({ message: "Username, email, and role are required" });
    }

    const updateLogic = (hash = null) => {
        let sql, values;
        if (hash) {
            sql = "UPDATE users SET username = ?, email = ?, role_name = ?, passwordd = ? WHERE user_ID = ?";
            values = [username, email, role_name, hash, user_ID];
        } else {
            sql = "UPDATE users SET username = ?, email = ?, role_name = ? WHERE user_ID = ?";
            values = [username, email, role_name, user_ID];
        }

        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ message: "Database error", error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
            res.status(200).json({ message: "User updated successfully" });
        });
    };

    if (passwordd) {
        bcrypt.hash(passwordd, 10, (err, hash) => {
            if (err) return res.status(500).json({ message: "Error hashing password" });
            updateLogic(hash);
        });
    } else {
        updateLogic();
    }
};

export const resetUserPasswordByAdmin = (req, res) => {
    const { user_ID } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ message: "New password is required" });

    bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: "Error hashing password" });

        const sql = "UPDATE users SET passwordd = ?, must_change_password = 1 WHERE user_ID = ?";
        db.query(sql, [hash, user_ID], (err, result) => {
            if (err) return res.status(500).json({ message: "Database error", error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
            res.status(200).json({ message: "Password reset successfully" });
        });
    });
};
export const getProfile = (req, res) => {
    const userId = req.user.user_ID;

    const sql = "SELECT username, email, role_name FROM users WHERE user_ID = ?";

    db.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(result[0]);
    });
};

export const updateProfile = (req, res) => {
    const userId = req.user.user_ID;
    const { fullName, email } = req.body;

    const sql = "UPDATE users SET username = ?, email = ? WHERE user_ID = ?";
    db.query(sql, [fullName, email, userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.status(200).json({ message: "Profile updated successfully" });
    });
};


export const verifyToken = (req, res) => {
    res.status(200).json({
        authenticated: true,
        user: req.user
    });
};


/*export const verifyToken = (req, res) => {
    res.status(200).json({
        authenticated: true,
        user: req.user
    });
};*/