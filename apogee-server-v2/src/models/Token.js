const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    tokenId: { type: String, required: true, unique: true },
    patientName: { type: String, default: "Walk-in Patient" },
    departmentCode: { type: String, required: true },
    departmentName: { type: String, required: true },
    entryMethod: { type: String, enum: ["Manual", "QR"], default: "Manual" },
    status: { type: String, enum: ["Waiting", "In Consultation", "Completed"], default: "Waiting" },
    queuePosition: { type: Number, default: 0 },
    predictedWaitMins: { type: Number, default: 0 },
    predictionSource: { type: String, enum: ["ai", "fallback"], default: "fallback" }, // ← NEW
    smartSuggestion: { type: String, default: "" },
    assignedDoctor: { type: String, default: "" },
    assignedRoom: { type: String, default: "" },
    calledAt: { type: Date, default: null },
    consultationStartedAt: { type: Date, default: null },
    consultationCompletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

tokenSchema.index({ departmentCode: 1, status: 1 });

module.exports = mongoose.model("Token", tokenSchema);
