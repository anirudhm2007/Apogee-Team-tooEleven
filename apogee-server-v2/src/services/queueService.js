const Department = require("../models/Department");
const Token = require("../models/Token");

function buildSuggestion(waitMins) {
  if (waitMins <= 5) return "Your turn is very close. Please stay nearby.";
  if (waitMins <= 15) return "Visit after 10-15 mins to reduce waiting time.";
  return `Expected delay is ${waitMins} mins. Consider checking nearby facilities and return in 15 mins.`;
}

async function recalculateDepartmentQueue(departmentCode) {
  const department = await Department.findOne({ code: departmentCode });
  if (!department) throw new Error("Department not found");

  const waitingTokens = await Token.find({ departmentCode, status: "Waiting" }).sort({ createdAt: 1 });
  const inConsultationCount = await Token.countDocuments({ departmentCode, status: "In Consultation" });

  const doctorLoadFactor = Math.max(department.activeDoctors - inConsultationCount, 1);
  const delayFactor = department.activeDoctors <= 1 ? 1.15 : 1;
  const queueLength = waitingTokens.length;

  // Run all AI predictions in parallel for performance
  const predictions = await Promise.all(
    waitingTokens.map((_, index) =>
      predictWaitTime(
        index + 1,
        department.avgConsultationMins,
        queueLength
      )
    )
  );

  const bulkOps = waitingTokens.map((token, index) => {
    const queuePosition = index + 1;

    // Formula-based fallback (same as before)
    const formulaWaitMins = Math.max(
      1,
      Math.round((department.avgConsultationMins * queuePosition * delayFactor) / doctorLoadFactor)
    );

    // Use AI prediction if available, otherwise use formula
    const predictedWaitMins = predictions[index]?.estimatedWaitTime ?? formulaWaitMins;
    const predictionSource = predictions[index]?.source ?? "fallback";

    return {
      updateOne: {
        filter: { _id: token._id },
        update: {
          $set: {
            queuePosition,
            predictedWaitMins,
            predictionSource,
            smartSuggestion: buildSuggestion(predictedWaitMins),
          },
        },
      },
    };
  });

  if (bulkOps.length > 0) await Token.bulkWrite(bulkOps);
}

async function getQueueOverview() {
  const departments = await Department.find().sort({ code: 1 });
  const result = [];

  for (const department of departments) {
    const currentPatient = await Token.findOne({ departmentCode: department.code, status: "In Consultation" }).sort({ createdAt: 1 });

    const waitingQueue = await Token.find({ departmentCode: department.code, status: "Waiting" })
      .sort({ createdAt: 1 })
      .select("tokenId patientName status queuePosition predictedWaitMins predictionSource assignedDoctor assignedRoom");

    result.push({
      department: {
        name: department.name,
        code: department.code,
        avgConsultationMins: department.avgConsultationMins,
        activeDoctors: department.activeDoctors,
      },
      currentPatient: currentPatient
        ? {
            tokenId: currentPatient.tokenId,
            patientName: currentPatient.patientName,
            assignedDoctor: currentPatient.assignedDoctor,
            assignedRoom: currentPatient.assignedRoom,
          }
        : null,
      waitingQueue,
      totalWaiting: waitingQueue.length,
    });
  }

  return result;
}

async function getDashboardStats() {
  const [waitingCount, inConsultationCount, completedTokens, waitingTokens] = await Promise.all([
    Token.countDocuments({ status: "Waiting" }),
    Token.countDocuments({ status: "In Consultation" }),
    Token.find({ status: "Completed", consultationStartedAt: { $ne: null }, consultationCompletedAt: { $ne: null } }),
    Token.find({ status: "Waiting" }).select("predictedWaitMins"),
  ]);

  const avgConsultationMins =
    completedTokens.length > 0
      ? Math.round(
          completedTokens.reduce((sum, t) => {
            const duration = (new Date(t.consultationCompletedAt) - new Date(t.consultationStartedAt)) / 60000;
            return sum + Math.max(duration, 1);
          }, 0) / completedTokens.length
        )
      : 0;

  const avgPredictedWaitMins =
    waitingTokens.length > 0
      ? Math.round(waitingTokens.reduce((sum, t) => sum + (t.predictedWaitMins || 0), 0) / waitingTokens.length)
      : 0;

  return {
    patientsWaiting: waitingCount,
    inConsultation: inConsultationCount,
    avgConsultationMins,
    avgPredictedWaitMins,
  };
}

module.exports = { recalculateDepartmentQueue, getQueueOverview, getDashboardStats };
