const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const validator = require('validator');

const userProfile = (req, res) => {
    res.json(req.user);
}

const userRegister = async (req, res) => {
    const { name, email, password } = req.body;

    // Email validation
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    // Password strength validation
    if (!password || !validator.isStrongPassword(password, {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0
    })) {
        return res.status(400).json({ 
            message: "Password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number" 
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ message: "Registered", user });
}

const userLogin = async (req, res) => {
    const { email, password } = req.body;

    // Email validation for login
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Wrong password" });
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
}

module.exports = { userProfile, userRegister, userLogin };
