const express = require("express");
const router = express.Router();
const Token = require("../models/Token");
const { recalculateDepartmentQueue, getQueueOverview, getDashboardStats } = require("../services/queueService");
const { emitRealtimeState } = require("../services/events");
const { getIO } = require("../config/socket");


async function broadcastState(io, token = null) {
  const [queueOverview, stats] = await Promise.all([getQueueOverview(), getDashboardStats()]);
  emitRealtimeState(io, { queueOverview, stats, token });
}


router.get("/stats", async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});


router.post("/call-next", async (req, res, next) => {
  try {
    const { departmentCode } = req.body;
    if (!departmentCode) return res.status(400).json({ message: "departmentCode is required" });

    
    const nextToken = await Token.findOne({ departmentCode, status: "Waiting" }).sort({ createdAt: 1 });
    if (!nextToken) return res.status(404).json({ message: "No patients waiting in this department" });

    nextToken.status = "In Consultation";
    nextToken.calledAt = new Date();
    nextToken.consultationStartedAt = new Date();
    await nextToken.save();

    await recalculateDepartmentQueue(departmentCode);

    
    const io = getIO();
    io.emit("notification", { tokenId: nextToken.tokenId, message: "You have been called. Please proceed." });

    await broadcastState(io, nextToken);
    res.json({ message: "Patient called", token: nextToken });
  } catch (err) {
    next(err);
  }
});


router.post("/assign", async (req, res, next) => {
  try {
    const { tokenId, assignedDoctor, assignedRoom } = req.body;
    if (!tokenId) return res.status(400).json({ message: "tokenId is required" });

    const token = await Token.findOne({ tokenId });
    if (!token) return res.status(404).json({ message: "Token not found" });

    if (assignedDoctor !== undefined) token.assignedDoctor = assignedDoctor;
    if (assignedRoom !== undefined) token.assignedRoom = assignedRoom;
    await token.save();

    const io = getIO();
    
    await broadcastState(io, token);
    res.json({ message: "Assigned successfully", token });
  } catch (err) {
    next(err);
  }
});


router.post("/complete", async (req, res, next) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ message: "tokenId is required" });

    const token = await Token.findOne({ tokenId });
    if (!token) return res.status(404).json({ message: "Token not found" });

    token.status = "Completed";
    token.consultationCompletedAt = new Date();
    await token.save();

    await recalculateDepartmentQueue(token.departmentCode);

    const io = getIO();
    io.emit("notification", { tokenId: token.tokenId, message: "Consultation completed. Thank you!" });

    await broadcastState(io, token);
    res.json({ message: "Consultation completed", token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
