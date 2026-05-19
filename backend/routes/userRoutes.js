const express = require("express");
const router = express.Router();

const { userProfile, userRegister, userLogin } = require("../controllers/userController.js");
const { auth } = require("../middleware/authMiddleware");

router.get("/profile", auth, userProfile);
router.post("/register", userRegister);
router.post("/login", userLogin);

module.exports = router;
