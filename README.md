# Apogee

A backend service for a hospital queue management system. It integrates real-time clinic data with an AI assistant to provide dynamic wait time predictions, queue tracking, and contextual responses based on live metrics.

---

## Team Name: tooEleven
### Team Members:
1. Anirudh Madhavan
2. Jainil Rathwa
3. Palksh Upadhyay

## Features:

###  Patient Side
- Role-based authentication (Login/Signup).
- Get a token instantly via manual entry.
- Real-time queue position and status updates.
- View complete medical history (past consultations, diagnoses, medicines, and conclusions).
- AI-powered estimated wait time with live countdown timer (ticks down every second).
- Floating AI chatbot for hospital info (timings, doctors, fees, directions).  

---

###  Doctor Side
- Role-based authentication (Login/Signup with Department matching).
- Live, department-specific waiting queue.
- "Call Next" functionality to automatically call the next patient in line.
- Active consultation portal to record diagnosis, suggested medicines, and conclusions directly to the patient's record.
- Instant access to the current patient's previous medical records and history.
- View a history log of all past patients seen by the doctor.

---

###  Admin Side
- Role-based authentication (Login/Signup).
- Call / manage specific tokens manually.
- Assign specific doctors and rooms to current patients.
- Mark consultations as complete.
- Live dashboard stats:
  - Waiting patients  
  - Patients in consultation  
  - Average wait time  
  - Average consultation time  
- **Danger Zone:** Instantly clear all active queues, end consultations, delete glitchy tokens, and reset system averages to baseline.

---

###  Display Board
- Live queue board for all departments.
- Real-time visual and text notifications when patients are called.
- Currently serving patient per department.
- Waiting queue with predicted wait times.

---

###  AI Features
- **Wait Time Prediction** (AI prediction with formula-based fallback logic).
- **Hospital Chatbot** (Live context of registered doctors, timings, fees, directions).
- **Strict Scoping** (Nurse Joy persona rejects irrelevant queries like coding, math, general knowledge).
- **Receptionist Fallback** (Directs to reception for emergencies or system failures).

---

## Tech Stack

- **Frontend:** React.js, Tailwind CSS 
- **Backend:** Node.js + Express.js, Socket.IO (Real-time socket events)
- **Database:** MongoDB 
- **AI/ML:** Groq API (llama-3.1-8b-instant for Chatbot)

---

##  Installation & Setup

1. Clone the repository

2. Setup and start the backend:
<pre>
cd apogee-server
npm install
create .env file with: MONGO_URI=mongodb://localhost:27017/apogee and GROQ_API_KEY=your_key
npm start
</pre>

3. Setup and start the frontend:
<pre>
cd apogee-reactjs
npm install
create .env file with: REACT_APP_API_URL=http://localhost:5000
npm start
</pre>

4. Open http://localhost:3000 in your browser
