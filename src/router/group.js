const express = require("express");
const router = express.Router();

// Import controller and middleware
const groupController = require("../controller/group.js");
const upload = require("../middleware/upload.js");
const authMiddleware = require("../middleware/auth");

// Group routes
router.get("/", groupController.getAllGroups);
router.get("/:id", groupController.getDetailGroup);
router.post("/", authMiddleware.protect, groupController.createGroup);
router.put("/:id", authMiddleware.protect, upload.single("image"), groupController.updateGroup);
router.delete("/:id", authMiddleware.protect, groupController.softDeleteGroup);

module.exports = router;
