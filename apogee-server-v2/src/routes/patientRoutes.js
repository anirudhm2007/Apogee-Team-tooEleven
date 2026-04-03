const express = require("express");
const router = express.Router();
const Department = require("../models/Department");
const Token = require("../models/Token");
const { recalculateDepartmentQueue, getQueueOverview, getDashboardStats } = require("../services/queueService");
const { emitRealtimeState } = require("../services/events");
const { getIO } = require("../config/socket");

// Body
router.post("/token", async (req, res, next) => {
  try {
    const { departmentCode, entryMethod = "Manual", patientName = "Walk-in Patient" } = req.body;

    const department = await Department.findOne({ code: departmentCode });
    if (!department) return res.status(404).json({ message: "Department not found" });

    // Increment token counter atomically
    const updatedDept = await Department.findByIdAndUpdate(
      department._id,
      { $inc: { tokenCounter: 1 } },
      { new: true }
    );

    const tokenId = `${department.code}-${updatedDept.tokenCounter}`;

    const newToken = await Token.create({
      tokenId,
      patientName,
      departmentCode: department.code,
      departmentName: department.name,
      entryMethod,
      status: "Waiting",
    });

    await recalculateDepartmentQueue(department.code);

    // Fetch 
    const updatedToken = await Token.findById(newToken._id);

    // Broadcast 
    const [queueOverview, stats] = await Promise.all([getQueueOverview(), getDashboardStats()]);
    emitRealtimeState(getIO(), { queueOverview, stats, token: updatedToken });

    res.status(201).json(updatedToken);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
