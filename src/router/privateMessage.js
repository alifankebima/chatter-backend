const express = require("express");
const router = express.Router();

// Import controller and middleware
const privateMessageController = require("../controller/privateMessage.js");
const authMiddleware = require("../middleware/auth");

// Group routes
router.get("/", privateMessageController.getAllPrivateMessages);
router.get("/list", authMiddleware.protect, privateMessageController.getUserPrivateMessageList);
router.get("/:id_receiver", authMiddleware.protect, privateMessageController.getReceiverPrivateMessages);
router.post("/:id_receiver", authMiddleware.protect, privateMessageController.createPrivateMessage);
router.put("/message/:id", authMiddleware.protect, privateMessageController.updatePrivatepMessage);
router.delete("/message/:id", authMiddleware.protect, privateMessageController.softDeletePrivateMessage);

module.exports = router;