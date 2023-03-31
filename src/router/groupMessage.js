const express = require("express");
const router = express.Router();

// Import controller and middleware
const groupMessageController = require("../controller/groupMessage.js");
const authMiddleware = require("../middleware/auth");

// Group routes
router.get("/", groupMessageController.getAllGroupMessages);
router.get("/:id_group", groupMessageController.getGroupMessages);
router.post("/:id_group", authMiddleware.protect, groupMessageController.createGroupMessage);
router.put("/message/:id", authMiddleware.protect, groupMessageController.updateGroupMessage);
router.delete("/message/:id", authMiddleware.protect, groupMessageController.softDeleteGroupMessage);

module.exports = router;