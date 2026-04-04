import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const statusColors = {
  Waiting: "text-yellow-300",
  "In Consultation": "text-cyan-300",
  Completed: "text-green-300",
};

let _socket;
const getSocket = () => {
  if (!_socket) _socket = io(SOCKET_URL);
  return _socket;
};

// HOME PAGE 
function HomePage({ navigate }) {
  return (
    <div className="min-h-screen bg-bg text-gray-100 flex flex-col items-center justify-center gap-10 px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-neonCyan neon-text mb-3">Apogee</h1>
        <p className="text-gray-400 text-lg">Smarter Patient Flow. Zero Chaos.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg">
        <button
          onClick={() => navigate("token")}
          className="flex-1 py-5 rounded-xl border border-neonPurple bg-neonPurple/10 hover:bg-neonPurple/20 hover:shadow-purpleGlow transition-all text-center"
        >
          <span className="text-2xl block mb-1">🏥</span>
          <span className="text-lg font-semibold text-neonPurple">Get Token</span>
          <p className="text-xs text-gray-400 mt-1">Register & join queue</p>
        </button>
        <button
          onClick={() => navigate("admin")}
          className="flex-1 py-5 rounded-xl border border-neonCyan bg-neonCyan/10 hover:bg-neonCyan/20 hover:shadow-glow transition-all text-center"
        >
          <span className="text-2xl block mb-1">🛠</span>
          <span className="text-lg font-semibold text-neonCyan">Admin</span>
          <p className="text-xs text-gray-400 mt-1">Manage patients & queue</p>
        </button>
        <button
          onClick={() => navigate("display")}
          className="flex-1 py-5 rounded-xl border border-green-400 bg-green-400/10 hover:bg-green-400/20 transition-all text-center"
        >
          <span className="text-2xl block mb-1">📺</span>
          <span className="text-lg font-semibold text-green-400">Display</span>
          <p className="text-xs text-gray-400 mt-1">Live queue board</p>
        </button>
      </div>
      <p className="text-xs text-gray-500">Built in 36 hours ⚡ | Team: tooEleven</p>
    </div>
  );
}

//  GET TOKEN PAGE 
function TokenPage({ navigate }) {
  const [departments, setDepartments] = useState([]);
  const [departmentCode, setDepartmentCode] = useState("");
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(false);


  const currentDepartment = departments.find((d) => d.code === departmentCode) || null;

  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data);
        if (data[0]) setDepartmentCode(data[0].code);
      });
  }, []);



  const generateToken = async (entryMethod) => {
  
    setLoading(true);
    console.log("generateToken called", { departmentCode, entryMethod, patientName });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("home")} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-neonCyan">Get Token</h1>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

       
        <div className="apogee-card space-y-3">
          <h3 className="text-xl text-neonCyan">Your Token</h3>
          <p className="text-gray-400">
            No active token yet. Fill in your details below and click Get Token.
          </p>
        </div>

        <div className="apogee-card space-y-3">
          <h3 className="text-xl text-neonCyan">Patient Entry</h3>
          <input
            className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]"
            placeholder="Patient name (optional)"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />
          <select
            className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]"
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
          >
            {departments.map((dep) => (
              <option key={dep.code} value={dep.code}>
                {dep.name} ({dep.code})
              </option>
            ))}
          </select>
          {currentDepartment && (
            <p className="text-xs text-gray-400">
              Avg consultation: {currentDepartment.avgConsultationMins} mins | Active doctors:{" "}
              {currentDepartment.activeDoctors}
            </p>
          )}
          <div className="flex gap-3">
            <button
              className="flex-1 py-2 rounded border border-neonPurple hover:shadow-purpleGlow disabled:opacity-50"
              onClick={() => generateToken("Manual")}
              disabled={loading}
            >
              {loading ? "Generating..." : "🎫 Get Token"}
            </button>
            <button
              className="flex-1 py-2 rounded border border-neonCyan hover:shadow-glow disabled:opacity-50"
              onClick={() => generateToken("QR")}
              disabled={loading}
            >
              📷 QR Scan (Simulate)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ADMIN PAGE
function AdminPage({ navigate }) {
  const [departments, setDepartments] = useState([]);
  const [departmentCode, setDepartmentCode] = useState("GEN");
  const [message, setMessage] = useState("");

  const stats = {
    patientsWaiting: "--",
    inConsultation: "--",
    avgPredictedWaitMins: "--",
    avgConsultationMins: "--",
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data);
        if (data[0]) setDepartmentCode(data[0].code);
      });
  }, []);

  const callNext = async () => {
    showMessage("Coming soon");
  };


  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("home")} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-neonCyan">Admin Panel</h1>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        <div className="apogee-card grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: "Waiting", value: stats.patientsWaiting, color: "text-yellow-300" },
            { label: "In Consultation", value: stats.inConsultation, color: "text-cyan-300" },
            { label: "Avg Wait", value: `${stats.avgPredictedWaitMins}m`, color: "text-neonPurple" },
            { label: "Avg Consult", value: `${stats.avgConsultationMins}m`, color: "text-green-300" },
          ].map((s) => (
            <div key={s.label} className="border border-[#2f2f4a] rounded p-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="apogee-card space-y-3">
          <h3 className="text-lg text-neonCyan">Call Next Patient</h3>
          <div className="flex gap-3">
            <select
              className="flex-1 p-2 rounded bg-[#151520] border border-[#2f2f4a]"
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <button
              className="px-5 py-2 rounded border border-neonCyan hover:shadow-glow"
              onClick={callNext}
            >
              📣 Call Next
            </button>
          </div>
          {message && <p className="text-sm text-neonCyan text-center">{message}</p>}
        </div>
        <div className="apogee-card space-y-3 opacity-40 pointer-events-none select-none">
          <h3 className="text-lg text-neonCyan">Assign / Complete</h3>
          <p className="text-xs text-gray-500 italic">— under construction —</p>
        </div>

      </main>
    </div>
  );
}

// DISPLAY PAGE 
function DisplayPage({ navigate }) {
  const queueOverview = [];

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("home")} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-neonCyan">Live Display Board</h1>
        <span className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />
          Offline
        </span>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {queueOverview.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <p className="text-4xl mb-4">📺</p>
            <p>Queue data will appear here once live socket is connected.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
          </div>
        )}

      </main>
    </div>
  );
}

//ROOT APP
function App() {
  const [page, setPage] = useState("home");
  const navigate = useCallback((p) => setPage(p), []);

  return (
    <>
      {page === "token" && <TokenPage navigate={navigate} />}
      {page === "admin" && <AdminPage navigate={navigate} />}
      {page === "display" && <DisplayPage navigate={navigate} />}
      {page === "home" && <HomePage navigate={navigate} />}
    </>
  );
}

export default App;
