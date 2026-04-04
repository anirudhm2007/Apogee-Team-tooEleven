const express = require("express");
const router = express.Router();
const Token = require("../models/Token");
const Patient = require("../models/Patient");
const { auth } = require("../middleware/auth");
const { recalculateDepartmentQueue, getQueueOverview, getDashboardStats } = require("../services/queueService");
const { emitRealtimeState } = require("../services/events");
const { getIO } = require("../config/socket");

router.use(auth);

router.get("/waiting", async (req, res) => {
  const tokens = await Token.find({ departmentCode: req.user.department, status: "Waiting" }).sort({ queuePosition: 1 });
  res.json(tokens);
});

router.post("/call-next", async (req, res) => {
  if (req.user.role !== "doctor") return res.status(403).json({ message: "Unauthorized" });

  const token = await Token.findOneAndUpdate(
    { departmentCode: req.user.department, status: "Waiting" },
    { status: "In Consultation", assignedDoctor: req.user.name, consultationStartedAt: new Date() },
    { sort: { queuePosition: 1 }, new: true }
  );

  if (!token) return res.status(404).json({ message: "No patients waiting" });

  let patientHistory = [];
  if (token.patientId) {
    const patient = await Patient.findById(token.patientId);
    if (patient) patientHistory = patient.consultations;
  }

  await recalculateDepartmentQueue(req.user.department);
  const [queueOverview, stats] = await Promise.all([getQueueOverview(), getDashboardStats()]);
  emitRealtimeState(getIO(), { queueOverview, stats, token });
  getIO().emit("notification", { tokenId: token.tokenId, message: `Please proceed to Doctor ${req.user.name}` });

  res.json({ token, patientHistory });
});

router.post("/complete", async (req, res) => {
  const { tokenId, diagnosis, medicines, notes } = req.body;
  
  const token = await Token.findOneAndUpdate(
    { tokenId, status: "In Consultation" },
    { status: "Completed", consultationCompletedAt: new Date() },
    { new: true }
  );

  if (!token) return res.status(404).json({ message: "Token not found or not in consultation" });

  if (token.patientId) {
    await Patient.findByIdAndUpdate(token.patientId, {
      $push: {
        consultations: { doctorName: req.user.name, department: token.departmentName, diagnosis, medicines, notes }
      }
    });
  }

  await recalculateDepartmentQueue(token.departmentCode);
  const [queueOverview, stats] = await Promise.all([getQueueOverview(), getDashboardStats()]);
  emitRealtimeState(getIO(), { queueOverview, stats, token });

  res.json({ message: "Consultation completed", token });
});

router.get("/history", async (req, res) => {
  const patients = await Patient.find({ "consultations.doctorName": req.user.name });
  const history = [];
  
  patients.forEach(p => {
    p.consultations.forEach(c => {
      if (c.doctorName === req.user.name) {
        history.push({ 
          patientName: p.name, 
          date: c.date,
          department: c.department,
          diagnosis: c.diagnosis,
          medicines: c.medicines,
          notes: c.notes
        });
      }
    });
  });
  
  // Sort by newest first
  res.json(history.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

module.exports = router;