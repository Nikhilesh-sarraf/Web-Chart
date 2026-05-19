const express = require("express");
const router = express.Router();
const { getMessages } = require("../controllers/messageController.js");
const { auth } = require("../middleware/authMiddleware.js");

router.get("/:roomId", auth, getMessages);

module.exports = router;
