import express from "express";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

import {
  addUser,
  requestPasswordReset,
  loginUser,
  resetPassword,
  getUsers,
  changePassword,
  getProfile,
  updateProfile,
  deleteUser,
  updateUser,
  resetUserPasswordByAdmin,
  verifyToken
  //verifyToken
} from "../controllers/userController.js";


const router = express.Router();

//routes to get all users
router.get("/verify-token", authenticateToken, verifyToken);

//router.get("/verify-token", authenticateToken, verifyToken);

router.get("/get-users", authenticateToken, requireAdmin, getUsers);

//routes to add admin logins
router.post("/add", authenticateToken, requireAdmin, addUser);
router.post("/add-user", authenticateToken, requireAdmin, addUser);

//routes to login admin
router.post("/login", loginUser);

//routes to request password reset
router.post("/request-reset", requestPasswordReset);

//routes to reset password
//router.post("/reset-password", resetPassword);

//routes to delete user
router.delete("/delete/:user_ID", authenticateToken, requireAdmin, deleteUser);

//routes to update user
router.put("/update/:user_ID", authenticateToken, requireAdmin, updateUser);

//routes to reset user password by admin
router.post("/reset-password/:user_ID", authenticateToken, requireAdmin, resetUserPasswordByAdmin);


// Protected Routes
router.post("/change-password", authenticateToken, changePassword);
router.get("/profile", authenticateToken, getProfile);
router.post("/profile", authenticateToken, updateProfile);

export default router;


