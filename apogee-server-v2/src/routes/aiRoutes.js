const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const { getQueueOverview, getDashboardStats } = require("../services/queueService");


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const RECEPTIONIST_FOOTER =
  "\n\n📞 If you are unhappy with my response, please call our receptionist Mrs. Swati at 8800XXXXXX.";

const HOSPITAL_SYSTEM_PROMPT = `
You are Nurse Joy, a friendly and helpful hospital assistant chatbot for XYZ Hospital located at ABV IIIT Gwalior.
Always introduce yourself as Nurse Joy when greeted.
You ONLY answer questions related to this hospital. If a user asks anything unrelated to the hospital 
(like coding, general knowledge, math, jokes, etc.), politely refuse and redirect them to hospital-related queries.
Here is the complete hospital information you must use to answer queries:

## Departments & Timings:
- Cardiology Department: 8:00 AM – 2:00 PM
- General Ward: 2:00 PM – 6:00 PM
- Skin Specialist (Dermatology): 10:00 AM – 4:00 PM

## Consultation Fees:
- Cardiology Department: ₹500 per consultation
- General Ward: ₹150 per consultation
- Skin Specialist: ₹300 per consultation

## Doctors:
- Cardiology Department:
  - Dr. Prakash Kumar: 8:00 AM – 11:30 AM
  - Dr. Om Shah: 10:30 AM – 2:00 PM
- General Ward:
  - Dr. Neha Sharma: 2:00 PM – 4:00 PM
  - Dr. Rajiv Mehta: 4:00 PM – 6:00 PM
- Skin Specialist:
  - Dr. Priya Iyer: 10:00 AM – 1:00 PM
  - Dr. Arjun Das: 1:00 PM – 4:00 PM

## Location & Directions:
- Address: ABV IIIT Gwalior
- The hospital is located inside the ABV IIIT Gwalior campus.
- Visitors should enter from the main gate and follow signs to the hospital wing.
- Parking is available near the main gate.

## Receptionist:
- Name: Mrs. Swati
- Phone: 8800XXXXXX

## Rules you must strictly follow:
1. Your name is Nurse Joy. Always refer to yourself as Nurse Joy.
2. ONLY answer questions about XYZ Hospital — timings, doctors, fees, directions, departments.
3. If someone asks anything unrelated (coding, jokes, general knowledge, math, etc.), respond ONLY with:
   "I'm Nurse Joy, and I'm only able to assist with hospital-related queries. Please ask about our doctors, timings, fees, or directions."
4. Keep answers short, clear, and friendly.
5. Never make up information not listed above.
6. Always be polite and professional.
7. Do not answer medical advice or diagnosis questions.
`;


async function buildQueueSystemPrompt(token) {
  const [queueOverview, stats] = await Promise.all([
    getQueueOverview(),
    getDashboardStats(),
  ]);

  const departmentLines = queueOverview
    .map(
      (d) =>
        `- ${d.department.name} (${d.department.code}): ${d.totalWaiting} waiting, ` +
        `${d.department.activeDoctors} doctor(s), avg ${d.department.avgConsultationMins} mins/patient`
    )
    .join("\n");

  const tokenSection = token
    ? `CURRENT PATIENT TOKEN:
- Token ID: ${token.tokenId}
- Department: ${token.departmentName}
- Status: ${token.status}
- Queue position: ${token.queuePosition}
- Estimated wait: ${token.predictedWaitMins} mins
- Assigned doctor: ${token.assignedDoctor || "Not yet assigned"}
- Assigned room: ${token.assignedRoom || "Not yet assigned"}`
    : "No active token for this patient yet.";

  return `You are a smart assistant for Apogee, a hospital queue management system.
Answer questions concisely based only on the live clinic data provided. Never make up data.

LIVE CLINIC DATA:
- Total patients waiting: ${stats.patientsWaiting}
- Patients in consultation: ${stats.inConsultation}
- Average predicted wait: ${stats.avgPredictedWaitMins} mins
- Average consultation time: ${stats.avgConsultationMins} mins

DEPARTMENTS:
${departmentLines}

${tokenSection}`;
}


router.post("/chat", async (req, res, next) => {
  try {
    const query = (req.body.message || req.body.query || "").trim();

    if (!query) {
      return res.status(400).json({ reply: "Please enter a valid question." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        reply: "AI assistant is not configured. Please add GROQ_API_KEY to your .env file.",
      });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: HOSPITAL_SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    const reply =
      response.choices[0]?.message?.content?.trim() ||
      "Sorry, I couldn't process that.";

    res.json({ reply: reply + RECEPTIONIST_FOOTER });
  } catch (err) {
    next(err);
  }
});


router.post("/queue-chat", async (req, res, next) => {
  try {
    const { query, token } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        reply: "AI assistant is not configured. Please add GROQ_API_KEY to your .env file.",
      });
    }

    const systemPrompt = await buildQueueSystemPrompt(token);

    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const reply =
      response.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I could not generate a response.";

    res.json({ reply });
  } catch (err) {
    console.error("Queue AI chat error:", err.message);
    res.json({ reply: "Assistant is unavailable right now." });
  }
});

router.post("/hospital-chat", async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ reply: "Please enter a valid question." });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: HOSPITAL_SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    const reply =
      response.choices[0]?.message?.content?.trim() ||
      "Sorry, I couldn't process that.";

    res.json({ reply: reply + RECEPTIONIST_FOOTER });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
