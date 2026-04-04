const express = require("express");
const router = express.Router();
const Department = require("../models/Department");
const Token = require("../models/Token");
const Patient = require("../models/Patient");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");
const { recalculateDepartmentQueue, getQueueOverview, getDashboardStats } = require("../services/queueService");
const { emitRealtimeState } = require("../services/events");
const { getIO } = require("../config/socket");

router.post("/token", async (req, res, next) => {
  try {
    const { departmentCode, entryMethod = "Manual", patientName = "Walk-in Patient" } = req.body;

    let patientId = null;
    let finalName = patientName;

    // Optional auth check to map token to registered patient
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        if (decoded.role === "patient") {
          patientId = decoded.userId;
          finalName = decoded.name;
        }
      } catch (e) {} // ignore invalid tokens for walk-ins
    }

    const department = await Department.findOne({ code: departmentCode });
    if (!department) return res.status(404).json({ message: "Department not found" });

    const updatedDept = await Department.findByIdAndUpdate(
      department._id,
      { $inc: { tokenCounter: 1 } },
      { new: true }
    );

    const tokenId = `${department.code}-${updatedDept.tokenCounter}`;

    const newToken = await Token.create({
      tokenId,
      patientId,
      patientName: finalName,
      departmentCode: department.code,
      departmentName: department.name,
      entryMethod,
      status: "Waiting",
    });

    await recalculateDepartmentQueue(department.code);
    const updatedToken = await Token.findById(newToken._id);

    const [queueOverview, stats] = await Promise.all([getQueueOverview(), getDashboardStats()]);
    emitRealtimeState(getIO(), { queueOverview, stats, token: updatedToken });

    res.status(201).json(updatedToken);
  } catch (err) {
    next(err);
  }
});

router.get("/my-active-token", auth, async (req, res) => {
  const token = await Token.findOne({ patientId: req.user.userId, status: { $ne: "Completed" } });
  res.json(token);
});

router.get("/history", auth, async (req, res) => {
  const patient = await Patient.findById(req.user.userId).select("consultations");
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  res.json(patient.consultations.sort((a, b) => b.date - a.date));
});

module.exports = router;