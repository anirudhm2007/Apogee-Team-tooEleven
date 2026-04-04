const Department = require("../models/Department");
const Token = require("../models/Token");
const { recalculateDepartmentQueue } = require("./queueService");

const departmentSeeds = [
  { name: "General", code: "GEN", avgConsultationMins: 8, activeDoctors: 2, rooms: ["1", "2"], tokenCounter: 100 },
  { name: "Cardiology", code: "CAR", avgConsultationMins: 12, activeDoctors: 1, rooms: ["3"], tokenCounter: 100 },
  { name: "Orthopedics", code: "ORT", avgConsultationMins: 10, activeDoctors: 2, rooms: ["4", "5"], tokenCounter: 100 },
];

async function seedInitialData() {
  const existingCount = await Department.countDocuments();
  if (existingCount > 0) {
    console.log("✅ Departments already seeded, skipping.");
    return;
  }

  console.log("🌱 Seeding departments...");
  const departments = await Department.insertMany(departmentSeeds);

  
  for (const dept of departments) {
    for (let i = 1; i <= 3; i++) {
      const tokenCounter = dept.tokenCounter + i;
      await Token.create({
        tokenId: `${dept.code}-${tokenCounter}`,
        patientName: `Sample Patient ${dept.code}${i}`,
        departmentCode: dept.code,
        departmentName: dept.name,
        entryMethod: i % 2 === 0 ? "QR" : "Manual",
        status: "Waiting",
      });
    }
    await Department.findByIdAndUpdate(dept._id, { $inc: { tokenCounter: 3 } });
    await recalculateDepartmentQueue(dept.code);
  }

  console.log("✅ Seeding complete.");
}

module.exports = { seedInitialData };
