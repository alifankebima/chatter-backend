const express = require("express");
const router = express.Router();

// Import controller and middleware
const groupMemberController = require("../controller/groupMember.js");
const authMiddleware = require("../middleware/auth");

// Group member routes
router.get("/", groupMemberController.getAllGroupMembers);
router.get("/:id_group", groupMemberController.getGroupMembers);
router.post("/:id_group", authMiddleware.protect, groupMemberController.createGroupMember);
router.delete("/:id_group", authMiddleware.protect, groupMemberController.softDeleteGroupMember);

module.exports = router;
