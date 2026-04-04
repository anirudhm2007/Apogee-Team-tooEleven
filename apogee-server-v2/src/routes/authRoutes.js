const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Admin = require("../models/Admin");

const generateToken = (user, role) => {
  return jwt.sign(
    { userId: user._id, role, name: user.name, department: user.department },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "24h" }
  );
};

router.post("/signup/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const data = req.body;
    let user;

    if (role === "patient") {
      user = await Patient.create(data);
    } else if (role === "doctor") {
      user = await Doctor.create(data);
    } else if (role === "admin") {
      user = await Admin.create(data);
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    const token = generateToken(user, role);
    res.status(201).json({ token, user: { id: user._id, name: user.name, role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { role, username, password } = req.body;
    let Model;

    if (role === "patient") Model = Patient;
    else if (role === "doctor") Model = Doctor;
    else if (role === "admin") Model = Admin;
    else return res.status(400).json({ message: "Invalid role" });

    const user = await Model.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user, role);
    res.json({ token, user: { id: user._id, name: user.name, role, department: user.department } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;