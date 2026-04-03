# Apogee

A backend service for a hospital queue management system. It integrates real-time clinic data with an AI assistant to provide dynamic wait time predictions, queue tracking, and contextual responses based on live metrics.

---

## Team Name: tooEleven
### Team Members:
1. Anirudh Madhavan
2. ⁠Jainil Rathwa
3. ⁠Palksh Upadhyay

## Features:

###  Patient Side
- Get a token instantly via manual entry.
- Real-time queue position and status updates.
- AI-powered estimated wait time with live countdown timer (ticks down every second)
- Floating AI chatbot for hospital info (timings, doctors, fees, directions)  

---

###  Admin Side
- Call next patient per department  
- Assign doctor and room to current patient  
- Mark consultation as complete  
- Live dashboard stats:
  - Waiting patients  
  - Patients in consultation  
  - Average wait time  
  - Average consultation time  

---

###  Display Board
- Live queue board for all departments  
- Real-time notifications when patients are called.
- Currently serving patient per department.
- Waiting queue with predicted wait times.

---

###  AI Features
- **Wait Time Prediction** (Groq LLaMA + fallback logic)  
- **Hospital Chatbot** (doctors, timings, fees, directions)  
- **Strict Scoping** (rejects irrelevant queries)  
- **Receptionist Fallback** (every reply includes contact info)  

---

## Tech Stack

- Frontend: React.js, CSS
- Backend: Node.js + Express.js  
- Database: MongoDB  
- AI/ML: Groq API (AI Assistant Chatbot)  

---

##  Installation & Setup

1. Clone the repository  
   git clone https://github.com/anirudhm2007/Apogee-Team-tooEleven.git  

2. Navigate into the project  
   cd apogee  

3. Install dependencies  
   npm install  

4. Create a `.env` file in root:

   GROQ_API_KEY = your_groq_api_key_here  
   PORT=3000  

5. Start the server  
   npm start  

---

##  Notes
- Designed for hackathons & rapid prototyping.
- Focused on simplicity, real-time performance, and practical AI integration.
