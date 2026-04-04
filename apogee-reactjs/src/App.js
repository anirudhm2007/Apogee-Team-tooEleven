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
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 How may I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, I'm unavailable right now. Please call Mrs. Swati at 8800XXXXXX." },
      ]);
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
              <span className="text-neonCyan font-semibold text-sm">XYZ Hospital Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 max-h-72">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.from === "user"
                    ? "bg-neonPurple/20 border border-neonPurple/40 text-white"
                    : "bg-[#1a1a2e] border border-[#2f2f4a] text-gray-200"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a2e] border border-[#2f2f4a] px-3 py-2 rounded-xl text-xs text-gray-400">
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="px-3 py-2 border-t border-[#2f2f4a] flex gap-2">
            <input
              className="flex-1 bg-[#151520] border border-[#2f2f4a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neonCyan"
              placeholder="Ask about doctors, timings..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-neonCyan text-neonCyan text-xs hover:shadow-glow disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-neonCyan/10 border-2 border-neonCyan hover:shadow-glow flex items-center justify-center text-2xl transition-all"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}

function HomePage({ navigate }) {
  return (
    <div className="min-h-screen bg-bg text-gray-100 flex flex-col items-center justify-center gap-10 px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-neonCyan neon-text mb-3">Apogee</h1>
        <p className="text-gray-400 text-lg">Smarter Patient Flow. Zero Chaos.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg">
        <button onClick={() => navigate("token")} className="flex-1 py-5 rounded-xl border border-neonPurple bg-neonPurple/10 hover:bg-neonPurple/20 hover:shadow-purpleGlow transition-all text-center">
          <span className="text-2xl block mb-1">🏥</span>
          <span className="text-lg font-semibold text-neonPurple">Get Token</span>
          <p className="text-xs text-gray-400 mt-1">Register & join queue</p>
        </button>
        <button onClick={() => navigate("admin")} className="flex-1 py-5 rounded-xl border border-neonCyan bg-neonCyan/10 hover:bg-neonCyan/20 hover:shadow-glow transition-all text-center">
          <span className="text-2xl block mb-1">🛠</span>
          <span className="text-lg font-semibold text-neonCyan">Admin</span>
          <p className="text-xs text-gray-400 mt-1">Manage patients & queue</p>
        </button>
        <button onClick={() => navigate("display")} className="flex-1 py-5 rounded-xl border border-green-400 bg-green-400/10 hover:bg-green-400/20 transition-all text-center">
          <span className="text-2xl block mb-1">📺</span>
          <span className="text-lg font-semibold text-green-400">Display</span>
          <p className="text-xs text-gray-400 mt-1">Live queue board</p>
        </button>
      </div>
      <p className="text-xs text-gray-500">Built in 36 hours ⚡ | Team: tooEleven</p>
    </div>
  );
}

function TokenPage({ navigate }) {
  const [departments, setDepartments] = useState([]);
  const [departmentCode, setDepartmentCode] = useState("");
  const [patientName, setPatientName] = useState("");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const { mins, secs, secondsLeft } = useCountdown(token?.predictedWaitMins || 0);
  const currentDepartment = departments.find((d) => d.code === departmentCode) || null;

  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data);
        if (data[0]) setDepartmentCode(data[0].code);
      });
  }, []);

  useEffect(() => {
    const s = getSocket();
    s.on("token:updated", (updated) => {
      if (token && updated.tokenId === token.tokenId) setToken(updated);
    });
    return () => s.off("token:updated");
  }, [token]);

  const generateToken = async (entryMethod) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/patient/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentCode, entryMethod, patientName: patientName || "Walk-in Patient" }),
      });
      const data = await res.json();
      setToken(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("home")} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <h1 className="text-xl font-bold text-neonCyan">Get Token</h1>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="apogee-card space-y-3">
          <h3 className="text-xl text-neonCyan">Your Token</h3>
          {token ? (
            <>
              <p>Token: <span className="text-neonPurple font-bold text-xl">{token.tokenId}</span></p>
              <p>Department: <span className="text-white">{token.departmentName}</span></p>
              <p>Status: <span className={statusColors[token.status] || ""}>{token.status}</span></p>
              <p>Estimated Wait:{" "}
                {token.status === "Completed" ? (
                  <span className="text-green-400 font-bold">Done ✅</span>
                ) : token.status === "In Consultation" ? (
                  <span className="text-cyan-300 font-bold">In Progress 🩺</span>
                ) : secondsLeft > 0 ? (
                  <span className="text-neonCyan font-bold tabular-nums">{mins}m {String(secs).padStart(2, "0")}s</span>
                ) : (
                  <span className="text-yellow-300 font-bold">Any moment now...</span>
                )}
              </p>
              <p>Queue Position: <span className="text-neonCyan">#{token.queuePosition}</span></p>
              <p>Doctor / Room: {token.assignedDoctor || "-"} / {token.assignedRoom || "-"}</p>
              <div className="w-full bg-[#1d1d29] h-2 rounded">
                <div className="bg-neonCyan h-2 rounded transition-all" style={{ width: `${token.status === "Completed" ? 100 : token.status === "In Consultation" ? 75 : 35}%` }} />
              </div>
              <p className="text-xs text-gray-400">{token.smartSuggestion}</p>
            </>
          ) : (
            <p className="text-gray-400">No active token yet. Fill in your details below and click Get Token.</p>
          )}
        </div>
        <div className="apogee-card space-y-3">
          <h3 className="text-xl text-neonCyan">Patient Entry</h3>
          <input className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" placeholder="Patient name (optional)" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          <select className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)}>
            {departments.map((dep) => (
              <option key={dep.code} value={dep.code}>{dep.name} ({dep.code})</option>
            ))}
          </select>
          {currentDepartment && (
            <p className="text-xs text-gray-400">Avg consultation: {currentDepartment.avgConsultationMins} mins | Active doctors: {currentDepartment.activeDoctors}</p>
          )}
          <div className="flex gap-3">
            <button className="flex-1 py-2 rounded border border-neonPurple hover:shadow-purpleGlow disabled:opacity-50" onClick={() => generateToken("Manual")} disabled={loading}>
              {loading ? "Generating..." : "🎫 Get Token"}
            </button>
            <button className="flex-1 py-2 rounded border border-neonCyan hover:shadow-glow disabled:opacity-50" onClick={() => generateToken("QR")} disabled={loading}>
              📷 QR Scan (Simulate)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminPage({ navigate }) {
  const [stats, setStats] = useState({ patientsWaiting: 0, avgPredictedWaitMins: 0, avgConsultationMins: 0, inConsultation: 0 });
  const [departments, setDepartments] = useState([]);
  const [departmentCode, setDepartmentCode] = useState("GEN");
  const [assignDoctor, setAssignDoctor] = useState("");
  const [assignRoom, setAssignRoom] = useState("");
  const [assignTokenId, setAssignTokenId] = useState("");
  const [message, setMessage] = useState("");

  const showMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/admin/stats`).then((r) => r.json()),
      fetch(`${API_BASE}/departments`).then((r) => r.json()),
    ]).then(([s, d]) => {
      setStats(s);
      setDepartments(d);
      if (d[0]) setDepartmentCode(d[0].code);
    });
    const s = getSocket();
    s.on("stats:updated", setStats);
    return () => s.off("stats:updated", setStats);
  }, []);

  const callNext = async () => {
    const res = await fetch(`${API_BASE}/admin/call-next`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ departmentCode }) });
    const data = await res.json();
    showMessage(data.message || "Called next patient");
  };

  const assignCurrent = async () => {
    if (!assignTokenId) return showMessage("Enter a Token ID first");
    const res = await fetch(`${API_BASE}/admin/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tokenId: assignTokenId, assignedDoctor: assignDoctor, assignedRoom: assignRoom }) });
    const data = await res.json();
    showMessage(data.message || "Assigned");
  };

  const completeConsultation = async () => {
    if (!assignTokenId) return showMessage("Enter a Token ID first");
    const res = await fetch(`${API_BASE}/admin/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tokenId: assignTokenId }) });
    const data = await res.json();
    showMessage(data.message || "Completed");
    setAssignTokenId(""); setAssignDoctor(""); setAssignRoom("");
  };

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <nav className="sticky top-0 z-10 border-b border-[#2c2c44] bg-[#0a0a0f]/90 backdrop-blur px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("home")} className="text-gray-400 hover:text-white text-sm">← Back</button>
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
            <select className="flex-1 p-2 rounded bg-[#151520] border border-[#2f2f4a]" value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)}>
              {departments.map((d) => (<option key={d.code} value={d.code}>{d.name} ({d.code})</option>))}
            </select>
            <button className="px-5 py-2 rounded border border-neonCyan hover:shadow-glow" onClick={callNext}>📣 Call Next</button>
          </div>
        </div>
        <div className="apogee-card space-y-3">
          <h3 className="text-lg text-neonCyan">Assign / Complete</h3>
          <input className="w-full p-2 rounded bg-[#151520] border border-[#2f2f4a]" placeholder="Token ID (e.g. GEN-101)" value={assignTokenId} onChange={(e) => setAssignTokenId(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" placeholder="Doctor name" value={assignDoctor} onChange={(e) => setAssignDoctor(e.target.value)} />
            <input className="p-2 rounded bg-[#151520] border border-[#2f2f4a]" placeholder="Room number" value={assignRoom} onChange={(e) => setAssignRoom(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2 rounded border border-neonPurple hover:shadow-purpleGlow" onClick={assignCurrent}>Assign Doctor / Room</button>
            <button className="flex-1 py-2 rounded border border-green-400 hover:shadow" onClick={completeConsultation}>✅ Complete</button>
          </div>
          {message && <p className="text-sm text-neonCyan text-center">{message}</p>}
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
        <span className="ml-auto flex items-center gap-2 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />Live
        </span>
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
                    {bucket.currentPatient.assignedRoom && <p className="text-xs text-gray-400">Room {bucket.currentPatient.assignedRoom}</p>}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No patient in consultation</p>
                )}
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
              <p className="text-xs text-gray-500">{bucket.department.activeDoctors} doctor(s) | {bucket.department.avgConsultationMins} min avg</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const navigate = useCallback((p) => setPage(p), []);

  return (
    <>
      {page === "token" && <TokenPage navigate={navigate} />}
      {page === "admin" && <AdminPage navigate={navigate} />}
      {page === "display" && <DisplayPage navigate={navigate} />}
      {page === "home" && <HomePage navigate={navigate} />}
      <FloatingChatbot />
    </>
  );
}

export default App;