const express = require("express");
const router = express.Router();

const userRouter = require("./user");
const groupRouter = require("./group");
const groupMemberRouter = require("./groupMember");
const groupMessageRouter = require("./groupMessage");

router.use("/v1/user", userRouter);
router.use("/v1/group", groupRouter);
router.use("/v1/group-member", groupMemberRouter);
router.use("/v1/group-message", groupMessageRouter);

module.exports = router;