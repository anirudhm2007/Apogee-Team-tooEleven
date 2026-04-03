const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  avgConsultationMins: { type: Number, default: 8 },
  activeDoctors: { type: Number, default: 1 },
  rooms: [{ type: String }],
  tokenCounter: { type: Number, default: 100 },
});

module.exports = mongoose.model("Department", departmentSchema);
