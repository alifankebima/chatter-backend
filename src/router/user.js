const express = require("express");
const router = express.Router();

// Import controller and middleware
const userController = require("../controller/user.js");
const upload = require("../middleware/upload.js");
const authMiddleware = require("../middleware/auth");

// User authentication routes
router.post("/register", userController.registerUser);
router.post("/resend-email-verification", userController.resendVerificationEmail);
router.post("/verify-email", userController.verifyUserEmail);
router.post("/login", userController.LoginUser);
router.post("/refresh-token", userController.refreshToken);
router.get("/profile", authMiddleware.protect, userController.getProfile);

// User routes
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getDetailUser);
router.put("/", authMiddleware.protect, upload.single("image"), userController.updateUser);
router.delete("/", authMiddleware.protect, userController.deleteUser);

module.exports = router;
