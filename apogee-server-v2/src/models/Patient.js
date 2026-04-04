const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  height: { type: Number },
  weight: { type: Number },
  bloodGroup: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  consultations: [{
    date: { type: Date, default: Date.now },
    doctorName: String,
    department: String,
    diagnosis: String,
    medicines: String,
    notes: String
  }]
}, { timestamps: true });

patientSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("Patient", patientSchema);