const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const Doctor = require("../models/Doctor"); // Required to fetch live doctor data

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ reply: "Please ask a question." });
    }

    // 1. Fetch live doctors from the database
    const doctors = await Doctor.find({}, 'name department specialization');
    
    // 2. Format the doctors into a readable string for the AI
    const doctorListText = doctors.length > 0
      ? doctors.map(d => `- Dr. ${d.name} (${d.specialization}, Dept: ${d.department})`).join("\n")
      : "No doctors are currently registered in the system.";

    // 3. Construct the dynamic system prompt
    const systemPrompt = `
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

## Location & Directions:
- Address: ABV IIIT Gwalior
- The hospital is located inside the ABV IIIT Gwalior campus.
- Visitors should enter from the main gate and follow signs to the hospital wing.
- Parking is available near the main gate.

## Receptionist:
- Name: Mrs. Swati
- Phone: 8800XXXXXX

## Currently Registered Doctors:
${doctorListText}

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

    // 4. Send the prompt and user query to Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.2, // Lowered to 0.2 so the AI strictly follows the rules and doesn't get overly creative
      max_tokens: 200,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (error) {
    console.error("Groq Chatbot Error:", error);
    res.status(500).json({ reply: "Sorry, my AI systems are currently offline. Please contact Mrs. Swati at 8800XXXXXX." });
  }
});

router.post("/predict", async (req, res) => {
    res.json({ message: "Prediction endpoint active" });
});

module.exports = router;