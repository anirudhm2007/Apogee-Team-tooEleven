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

2. Setup and start the backend:

cd apogee-server
npm install
create .env file with: MONGO_URI=mongodb://localhost:27017/apogee and GROQ_API_KEY=your_key
npm start

3. Setup and start the frontend:

cd apogee-reactjs
npm install
create .env file with: REACT_APP_API_URL=http://localhost:5000
npm start

4. Open http://localhost:3000 in your browser

---

##  Notes
- Designed for hackathons & rapid prototyping.
- Focused on simplicity, real-time performance, and practical AI integration.
