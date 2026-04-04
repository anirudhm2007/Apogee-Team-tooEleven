const Groq = require("groq-sdk");

async function predictWaitTime(position, avgTime, queueLength) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a hospital queue management AI. Always respond with ONLY a single integer representing estimated wait time in minutes. No explanation, no units, just the number.",
        },
        {
          role: "user",
          content: `Patient position: ${position}, Average consultation time per patient: ${avgTime} mins, Total queue length: ${queueLength}. Estimate wait time in minutes.`,
        },
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    const estimated = parseInt(raw, 10);

    if (isNaN(estimated)) throw new Error("Invalid AI response: " + raw);

    return { estimatedWaitTime: estimated, source: "ai" };
  } catch (error) {
    console.warn("Groq prediction failed, using fallback:", error.message);
    return fallbackPrediction(position, avgTime, queueLength);
  }
}

function fallbackPrediction(position, avgTime, queueLength) {
  const estimatedWaitTime = Math.max(1, Math.round((avgTime * position) / Math.max(queueLength * 0.1, 1)));
  return { estimatedWaitTime, source: "fallback" };
}

module.exports = { predictWaitTime };
