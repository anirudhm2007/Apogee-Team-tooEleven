import { useEffect, useState, useCallback, useRef } from "react";
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

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } : { "Content-Type": "application/json" };
};

function useCountdown(initialMinutes) {
  const [secondsLeft, setSecondsLeft] = useState((initialMinutes || 0) * 60);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSecondsLeft((initialMinutes || 0) * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  return { mins, secs, secondsLeft };
}

function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: "👋 How may I help you?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I'm unavailable right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-[#0e0e1a] border border-[#2f2f4a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-[#13131f] px-4 py-3 flex items-center justify-between border-b border-[#2f2f4a]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              <span className="text-neonCyan font-semibold text-sm">Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 max-h-72">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap ${
                  msg.from === "user" ? "bg-neonPurple/20 border border-neonPurple/40 text-white" : "bg-[#1a1a2e] border border-[#2f2f4a] text-gray-200"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400">Typing...</div>}
            <div ref={bottomRef} />
          </div>
          <div className="px-3 py-2 border-t border-[#2f2f4a] flex gap-2">
            <input className="flex-1 bg-[#151520] border border-[#2f2f4a] rounded-lg px-3 py-1.5 text-xs text-white" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} disabled={loading} />
            <button onClick={sendMessage} disabled={loading} className="px-3 py-1.5 rounded-lg border border-neonCyan text-neonCyan text-xs hover:shadow-glow">Send</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="w-14 h-14 rounded-full bg-neonCyan/10 border-2 border-neonCyan hover:shadow-glow flex items-center justify-center text-2xl transition-all">
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}

function AuthPage({ navigate, role, setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const url = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/signup/${role}`;
    const payload = isLogin ? { ...formData, role } : formData;

    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    
    if (!res.ok) return setError(data.message);
    
    localStorage.setItem("token", data.token);
    setUser(data.user);
    navigate(role);
  };

  return (
    <div className="min-h-screen bg-bg text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="apogee-card w-full max-w-md space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neonCyan capitalize">{role} {isLogin ? "Login" : "Sign Up"}</h2>
          <button onClick={() => navigate("home")} className="text-gray-400 text-sm">Cancel</button>
        </div>
        
        {error && <div className="p-2 bg-red-500/20 text-red-300 text-sm rounded border border-red-500/50">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && role === "patient" && (
            <>
              <input name="name" placeholder="Full Name" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
              <div className="grid grid-cols-2 gap-2">
                <input name="age" type="number" placeholder="Age" onChange={handleChange} className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
                <select name="gender" onChange={handleChange} className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" required>
                  <option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input name="height" type="number" placeholder="Ht (cm)" onChange={handleChange} className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" />
                <input name="weight" type="number" placeholder="Wt (kg)" onChange={handleChange} className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" />
                <input name="bloodGroup" placeholder="Blood Grp" onChange={handleChange} className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" />
              </div>
            </>
          )}
          {!isLogin && role === "doctor" && (
            <>
              <input name="name" placeholder="Doctor Name" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
              <input name="doctorId" placeholder="Doctor ID" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
              <input name="specialization" placeholder="Specialization" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
              <input name="department" placeholder="Department Code (e.g. GEN)" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
            </>
          )}
          {!isLogin && role === "admin" && (
            <>
              <input name="name" placeholder="Admin Name" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
              <input name="adminId" placeholder="Admin ID" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
            </>
          )}

          <input name="username" placeholder="Username" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" required />
          
          <button type="submit" className="w-full py-2 rounded bg-neonCyan text-bg font-bold hover:shadow-glow transition-all">
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-neonPurple hover:underline">
            {isLogin ? "New user? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientPage({ navigate, user, logout }) {
  const [departments, setDepartments] = useState([]);
  const [departmentCode, setDepartmentCode] = useState("");
  const [token, setToken] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const { mins, secs } = useCountdown(token?.predictedWaitMins || 0);

  useEffect(() => {
    fetch(`${API_BASE}/departments`).then((r) => r.json()).then((data) => {
      setDepartments(data);
      if (data[0]) setDepartmentCode(data[0].code);
    });
    fetch(`${API_BASE}/patient/my-active-token`, { headers: getAuthHeaders() }).then(r => r.json()).then(data => {
      if (data && !data.message) setToken(data);
    });
    fetch(`${API_BASE}/patient/history`, { headers: getAuthHeaders() }).then(r => r.json()).then(setHistory);
  }, []);

  useEffect(() => {
    const s = getSocket();
    s.on("token:updated", (updated) => { if (token && updated.tokenId === token.tokenId) setToken(updated); });
    return () => s.off("token:updated");
  }, [token]);

  const generateToken = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/patient/token`, {
      method: "POST", headers: getAuthHeaders(),
      body: JSON.stringify({ departmentCode, entryMethod: "Manual" }),
    });
    const data = await res.json();
    setToken(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neonCyan">Welcome, {user?.name}</h1>
        <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="apogee-card space-y-3">
          <h3 className="text-xl text-neonCyan">Your Current Token</h3>
          {token && token.status !== "Completed" ? (
            <>
              <p>Token: <span className="text-neonPurple font-bold text-xl">{token.tokenId}</span></p>
              <p>Department: <span className="text-white">{token.departmentName}</span></p>
              <p>Status: <span className={statusColors[token.status]}>{token.status}</span></p>
              <p>Estimated Wait: {token.status === "In Consultation" ? <span className="text-cyan-300 font-bold">In Progress 🩺</span> : <span className="text-neonCyan font-bold tabular-nums">{mins}m {String(secs).padStart(2, "0")}s</span>}</p>
              <p>Queue Position: <span className="text-neonCyan">#{token.queuePosition}</span></p>
              <div className="w-full bg-[#1d1d29] h-2 rounded"><div className="bg-neonCyan h-2 rounded transition-all" style={{ width: `${token.status === "In Consultation" ? 75 : 35}%` }} /></div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400">No active token. Join a queue:</p>
              <select className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)}>
                {departments.map((dep) => (<option key={dep.code} value={dep.code}>{dep.name} ({dep.code})</option>))}
              </select>
              <button className="w-full py-2 rounded border border-neonPurple hover:shadow-purpleGlow disabled:opacity-50" onClick={generateToken} disabled={loading}>
                {loading ? "Generating..." : "🎫 Get Token"}
              </button>
            </div>
          )}
        </div>

        <div className="apogee-card space-y-3">
          <h3 className="text-xl text-neonPurple">Your Medical History</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {history.length === 0 ? <p className="text-gray-500 text-sm">No past consultations found.</p> : history.map((c, idx) => (
              <div key={idx} className="border border-[#2f2f4a] p-3 rounded bg-[#151520]">
                <div className="flex justify-between text-sm text-neonCyan mb-1">
                  <span>Dr. {c.doctorName} ({c.department})</span>
                  <span>{new Date(c.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm"><span className="text-gray-400">Diagnosis:</span> {c.diagnosis}</p>
                <p className="text-sm"><span className="text-gray-400">Medicines:</span> {c.medicines}</p>
                <p className="text-sm"><span className="text-gray-400">Conclusion:</span> {c.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function DoctorPage({ navigate, user, logout }) {
  const [waiting, setWaiting] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [history, setHistory] = useState([]);
  const [consultData, setConsultData] = useState({ diagnosis: "", medicines: "", notes: "" });
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const fetchDashboard = () => {
    fetch(`${API_BASE}/doctor/waiting`, { headers: getAuthHeaders() }).then(r => r.json()).then(setWaiting);
    fetch(`${API_BASE}/doctor/history`, { headers: getAuthHeaders() }).then(r => r.json()).then(setHistory);
  };

  useEffect(() => { fetchDashboard(); const s = getSocket(); s.on("queue:updated", fetchDashboard); return () => s.off("queue:updated", fetchDashboard); }, []);

  const callNext = async () => {
    const res = await fetch(`${API_BASE}/doctor/call-next`, { method: "POST", headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setCurrentPatient(data.token);
      setPatientHistory(data.patientHistory || []);
      setConsultData({ diagnosis: "", medicines: "", notes: "" });
      setExpandedHistoryId(null);
      fetchDashboard();
    } else alert(data.message);
  };

  const completeConsultation = async () => {
    await fetch(`${API_BASE}/doctor/complete`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ tokenId: currentPatient.tokenId, ...consultData }) });
    setCurrentPatient(null);
    fetchDashboard();
  };

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neonCyan">Dr. {user?.name} - {user?.department}</h1>
        <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="apogee-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg text-neonCyan">Waiting Queue ({waiting.length})</h3>
              <button onClick={callNext} disabled={!!currentPatient || waiting.length === 0} className="px-4 py-2 text-sm rounded border border-neonCyan hover:shadow-glow disabled:opacity-50">📣 Call Next</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {waiting.map(t => (
                <div key={t.tokenId} className="flex justify-between p-2 border border-[#2f2f4a] rounded bg-[#151520] text-sm">
                  <span className="font-bold text-neonPurple">{t.tokenId}</span>
                  <span>{t.patientName}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="apogee-card">
            <h3 className="text-lg text-neonPurple mb-4">Past Patients Seen</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="p-2 border border-[#2f2f4a] rounded bg-[#151520] text-sm">
                  <p className="text-neonCyan">{h.patientName} <span className="text-gray-500 text-xs ml-2">{new Date(h.date).toLocaleDateString()}</span></p>
                  <p className="text-gray-400 text-xs truncate">Diag: {h.diagnosis}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="apogee-card">
          <h3 className="text-lg text-green-400 mb-4">Active Consultation</h3>
          {currentPatient ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#151520] border border-[#2f2f4a] rounded">
                <p className="text-xl font-bold text-neonPurple">{currentPatient.tokenId}</p>
                <p className="text-lg">{currentPatient.patientName}</p>
              </div>
              
              {patientHistory.length > 0 && (
                <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 rounded">
                  <p className="text-sm text-yellow-300 font-bold mb-2">Previous Records</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto text-xs pr-1">
                    {patientHistory.map((h, i) => (
                      <div key={i} className="border border-[#2f2f4a] bg-[#151520] rounded p-2 transition-all">
                        <div className="flex justify-between items-start cursor-pointer group" onClick={() => setExpandedHistoryId(expandedHistoryId === i ? null : i)}>
                          <div className="flex-1">
                            <span className="text-gray-400">{new Date(h.date).toLocaleDateString()}:</span>{" "}
                            <span className="text-gray-200">{h.notes || "No conclusion provided."}</span>
                          </div>
                          <button className="text-neonCyan ml-2 group-hover:underline text-[10px] whitespace-nowrap">
                            {expandedHistoryId === i ? "Hide" : "View Details"}
                          </button>
                        </div>
                        
                        {expandedHistoryId === i && (
                          <div className="mt-2 pt-2 border-t border-[#2f2f4a] space-y-1 text-gray-300">
                            <p><span className="text-gray-500">Diagnosis:</span> {h.diagnosis || "-"}</p>
                            <p><span className="text-gray-500">Medicines:</span> {h.medicines || "-"}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <input placeholder="Diagnosis" className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" value={consultData.diagnosis} onChange={e => setConsultData({...consultData, diagnosis: e.target.value})} />
                <textarea placeholder="Suggested Medicines" className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a] h-20" value={consultData.medicines} onChange={e => setConsultData({...consultData, medicines: e.target.value})} />
                <textarea placeholder="Conclusion" className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a] h-20" value={consultData.notes} onChange={e => setConsultData({...consultData, notes: e.target.value})} />
                <button onClick={completeConsultation} className="w-full py-2 rounded bg-green-500/20 text-green-400 border border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all font-bold">✅ Complete & Save</button>
              </div>
            </div>
          ) : <p className="text-gray-500">Call a patient to begin consultation.</p>}
        </div>
      </main>
    </div>
  );
}

function AdminPage({ navigate, logout }) {
  const [stats, setStats] = useState({ patientsWaiting: 0, avgPredictedWaitMins: 0, avgConsultationMins: 0, inConsultation: 0 });
  const [assignTokenId, setAssignTokenId] = useState("");
  const [assignDoctor, setAssignDoctor] = useState("");
  const [assignRoom, setAssignRoom] = useState("");
  const [message, setMessage] = useState("");

  const showMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  useEffect(() => {
    fetch(`${API_BASE}/admin/stats`).then((r) => r.json()).then(setStats);
    const s = getSocket();
    s.on("stats:updated", setStats);
    return () => s.off("stats:updated", setStats);
  }, []);

  const assignCurrent = async () => {
    if (!assignTokenId) return showMessage("Enter a Token ID first");
    const res = await fetch(`${API_BASE}/admin/assign`, {
      method: "POST", 
      headers: getAuthHeaders(), 
      body: JSON.stringify({ tokenId: assignTokenId, assignedDoctor: assignDoctor, assignedRoom: assignRoom })
    });
    const data = await res.json();
    showMessage(data.message || "Assigned & Called");
  };

  const completeConsultation = async () => {
    if (!assignTokenId) return showMessage("Enter a Token ID first");
    const res = await fetch(`${API_BASE}/admin/complete`, {
      method: "POST", 
      headers: getAuthHeaders(), 
      body: JSON.stringify({ tokenId: assignTokenId })
    });
    const data = await res.json();
    showMessage(data.message || "Consultation Completed");
    setAssignTokenId(""); setAssignDoctor(""); setAssignRoom("");
  };

  const clearAllQueues = async () => {
    if (!window.confirm("⚠️ WARNING: This will instantly end ALL active consultations and clear EVERY patient from the waiting list. Are you absolutely sure?")) return;

    const res = await fetch(`${API_BASE}/admin/clear-all`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await res.json();
    showMessage(data.message || "All queues wiped clean.");
  };

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neonCyan">System Admin Panel</h1>
        <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="apogee-card grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[{ label: "Waiting", value: stats.patientsWaiting, color: "text-yellow-300" },
            { label: "In Consultation", value: stats.inConsultation, color: "text-cyan-300" },
            { label: "Avg Wait", value: `${stats.avgPredictedWaitMins}m`, color: "text-neonPurple" },
            { label: "Avg Consult", value: `${stats.avgConsultationMins}m`, color: "text-green-300" }
          ].map((s) => (
            <div key={s.label} className="border border-[#2f2f4a] rounded p-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="apogee-card space-y-3">
          <h3 className="text-lg text-neonCyan">Call / Manage Specific Token</h3>
          <input className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" placeholder="Token ID (e.g. GEN-1)" value={assignTokenId} onChange={(e) => setAssignTokenId(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" placeholder="Doctor Name (optional)" value={assignDoctor} onChange={(e) => setAssignDoctor(e.target.value)} />
            <input className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" placeholder="Room Number (optional)" value={assignRoom} onChange={(e) => setAssignRoom(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2 rounded border border-neonPurple hover:shadow-purpleGlow" onClick={assignCurrent}>📣 Call & Assign</button>
            <button className="flex-1 py-2 rounded border border-green-400 hover:shadow" onClick={completeConsultation}>✅ Mark Completed</button>
          </div>
          {message && <p className="text-sm text-neonCyan text-center mt-2">{message}</p>}
        </div>

        <div className="apogee-card space-y-3 border border-red-500/30 bg-red-500/5">
          <h3 className="text-lg text-red-400">Danger Zone</h3>
          <p className="text-sm text-gray-400">This action will mark all currently waiting and in-consultation patients as "Completed".</p>
          <button onClick={clearAllQueues} className="w-full py-2 rounded bg-red-500/10 text-red-400 border border-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all font-bold">
            ⚠️ Clear All Queues & Consultations
          </button>
        </div>
      </main>
    </div>
  );
}

function DisplayPage({ navigate }) {
  const [queueOverview, setQueueOverview] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/queue/overview`).then((r) => r.json()).then(setQueueOverview);
    const s = getSocket();
    s.on("queue:updated", setQueueOverview);
    s.on("notification", (msg) => { setNotifications((prev) => [msg, ...prev].slice(0, 6)); });
    return () => { s.off("queue:updated", setQueueOverview); s.off("notification"); };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("home")} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <h1 className="text-xl font-bold text-neonCyan">Live Display Board</h1>
        <span className="ml-auto flex items-center gap-2 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />Live</span>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {notifications.length > 0 && (
          <div className="apogee-card">
            <h3 className="text-lg text-neonPurple mb-3">🔔 Live Notifications</h3>
            <div className="space-y-2">
              {notifications.map((n, idx) => (
                <div key={idx} className="flex items-center gap-3 border border-[#2f2f4a] rounded px-3 py-2 text-sm">
                  <span className="text-neonCyan font-semibold">{n.tokenId}</span>
                  <span className="text-gray-300">{n.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-5">
          {queueOverview.map((bucket) => (
            <div key={bucket.department.code} className="apogee-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neonCyan">{bucket.department.name}</h3>
                <span className="text-xs border border-[#353552] px-2 py-1 rounded">{bucket.department.code}</span>
              </div>
              <div className="border border-neonCyan/30 rounded p-3 bg-neonCyan/5">
                <p className="text-xs text-gray-400 mb-1">Now Serving</p>
                {bucket.currentPatient ? (
                  <>
                    <p className="text-neonCyan font-bold text-lg">{bucket.currentPatient.tokenId}</p>
                    <p className="text-xs text-gray-300">{bucket.currentPatient.patientName}</p>
                    {bucket.currentPatient.assignedDoctor && <p className="text-xs text-gray-400">Dr. {bucket.currentPatient.assignedDoctor}</p>}
                  </>
                ) : <p className="text-gray-500 text-sm">No patient in consultation</p>}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Waiting: <span className="text-yellow-300 font-semibold">{bucket.totalWaiting}</span></p>
                <div className="space-y-1 max-h-36 overflow-auto pr-1">
                  {bucket.waitingQueue.slice(0, 6).map((item) => (
                    <div key={item.tokenId} className="flex items-center justify-between text-xs border border-[#2a2a3a] rounded px-2 py-1">
                      <span className="text-neonPurple font-semibold">{item.tokenId}</span>
                      <span className="text-gray-400">~{item.predictedWaitMins}m</span>
                    </div>
                  ))}
                  {bucket.waitingQueue.length === 0 && <p className="text-gray-500 text-xs">No patients waiting</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function HomePage({ handleAuthNav, navigate }) {
  return (
    <div className="min-h-screen bg-bg text-gray-100 flex flex-col items-center justify-center gap-10 px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-neonCyan neon-text mb-3">Apogee</h1>
        <p className="text-gray-400 text-lg">Smarter Patient Flow. Zero Chaos.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-4xl">
        <button onClick={() => handleAuthNav("patient")} className="py-5 rounded-xl border border-neonPurple bg-neonPurple/10 hover:bg-neonPurple/20 hover:shadow-purpleGlow transition-all text-center">
          <span className="text-2xl block mb-1">🏥</span>
          <span className="text-lg font-semibold text-neonPurple">Patient</span>
          <p className="text-xs text-gray-400 mt-1">Join queue & view history</p>
        </button>
        <button onClick={() => handleAuthNav("doctor")} className="py-5 rounded-xl border border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 hover:shadow-glow transition-all text-center">
          <span className="text-2xl block mb-1">🩺</span>
          <span className="text-lg font-semibold text-cyan-400">Doctor</span>
          <p className="text-xs text-gray-400 mt-1">Consult & prescribe</p>
        </button>
        <button onClick={() => handleAuthNav("admin")} className="py-5 rounded-xl border border-neonCyan bg-neonCyan/10 hover:bg-neonCyan/20 hover:shadow-glow transition-all text-center">
          <span className="text-2xl block mb-1">🛠</span>
          <span className="text-lg font-semibold text-neonCyan">Admin</span>
          <p className="text-xs text-gray-400 mt-1">Monitor hospital stats</p>
        </button>
        <button onClick={() => navigate("display")} className="py-5 rounded-xl border border-green-400 bg-green-400/10 hover:bg-green-400/20 transition-all text-center">
          <span className="text-2xl block mb-1">📺</span>
          <span className="text-lg font-semibold text-green-400">Display</span>
          <p className="text-xs text-gray-400 mt-1">Live queue board</p>
        </button>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        if (decoded.exp * 1000 > Date.now()) setUser({ id: decoded.userId, name: decoded.name, role: decoded.role, department: decoded.department });
        else localStorage.removeItem("token");
      } catch (e) { localStorage.removeItem("token"); }
    }
  }, []);

  const navigate = useCallback((p) => setPage(p), []);
  
  const handleAuthNav = (role) => {
    if (user && user.role === role) navigate(role);
    else navigate(`auth-${role}`);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("home");
  };

  return (
    <>
      {page === "home" && <HomePage handleAuthNav={handleAuthNav} navigate={navigate} />}
      {page === "display" && <DisplayPage navigate={navigate} />}
      
      {page.startsWith("auth-") && <AuthPage role={page.split("-")[1]} navigate={navigate} setUser={setUser} />}
      
      {page === "patient" && <PatientPage navigate={navigate} user={user} logout={logout} />}
      {page === "doctor" && <DoctorPage navigate={navigate} user={user} logout={logout} />}
      {page === "admin" && <AdminPage navigate={navigate} user={user} logout={logout} />}
      
      <FloatingChatbot />
    </>
  );
}

export default App;