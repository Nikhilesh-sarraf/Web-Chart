const express = require("express");
const router = express.Router();
const { createRoom, getAllRooms, joinRoom, deleteRoom } = require("../controllers/roomController.js");
const { auth } = require("../middleware/authMiddleware.js");

router.post("/create", auth, createRoom);
router.get("/", auth, getAllRooms);
router.post("/join", auth, joinRoom);
router.delete("/:roomId", auth, deleteRoom);

module.exports = router;
