import React, { useState, useEffect } from "react";
import "./App.css";
import { socket } from "./socket";
import config from "./config";

// TODO: import department components once built
// import DepartmentPanel from "./components/DepartmentPanel";

function App() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");

  // TODO: add patient form state
  // TODO: add admin auth state

  useEffect(() => {
    fetchDepartments();

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("queueUpdate", (data) => {
      // TODO: handle real-time queue updates
      console.log("Queue update received", data);
    });

    return () => {
      socket.off("connect");
      socket.off("queueUpdate");
    };
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/departments`);
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept);
    // TODO: fetch queue for selected department
  };

  const handleTokenGenerate = () => {
    // TODO: wire up token generation
    alert("Coming soon");
  };

  const handleAdminLogin = () => {
    // TODO: implement admin login flow
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Apogee</h1>
          <span className="navbar-subtitle">Hospital Queue System</span>
        </div>
        <div className="navbar-actions">
          <button className="btn btn-outline" onClick={handleAdminLogin}>
            Admin Login
          </button>
        </div>
      </nav>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "queue" ? "active" : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          Queue
        </button>
        <button
          className={`tab-btn ${activeTab === "departments" ? "active" : ""}`}
          onClick={() => setActiveTab("departments")}
        >
          Departments
        </button>
        <button
          className={`tab-btn ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          AI Insights
        </button>
      </div>

      {/* Main Content */}
      <main className="main-content">

        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div className="queue-section">
            <div className="section-header">
              <h2>Live Queue</h2>
              <button className="btn btn-primary" onClick={handleTokenGenerate}>
                + Get Token
              </button>
            </div>

            {selectedDept ? (
              <p className="selected-dept-label">
                Showing queue for: <strong>{selectedDept.name}</strong>
              </p>
            ) : (
              <p className="hint-text">Select a department to view its queue</p>
            )}

            {loading ? (
              <div className="loading-placeholder">Loading...</div>
            ) : queue.length === 0 ? (
              <div className="empty-state">
                <p>No patients in queue</p>
                {/* TODO: add illustration */}
              </div>
            ) : (
              <ul className="queue-list">
                {queue.map((token) => (
                  <li key={token._id} className="queue-item">
                    <span className="token-number">{token.tokenNumber}</span>
                    <span className="patient-name">{token.patientName}</span>
                    <span className={`status-badge status-${token.status}`}>
                      {token.status}
                    </span>
                    <div className="queue-item-actions">
                      <button className="btn btn-sm">Call</button>
                      <button className="btn btn-sm btn-danger">Skip</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <div className="departments-section">
            <div className="section-header">
              <h2>Departments</h2>
              {/* TODO: Add department button — admin only */}
            </div>

            {loading ? (
              <div className="loading-placeholder">Loading departments...</div>
            ) : (
              <div className="dept-grid">
                {departments.map((dept) => (
                  <div
                    key={dept._id}
                    className={`dept-card ${selectedDept?._id === dept._id ? "dept-card--active" : ""}`}
                    onClick={() => handleDeptSelect(dept)}
                  >
                    <h3 className="dept-name">{dept.name}</h3>
                    <p className="dept-meta">
                      {/* TODO: show live count from socket */}
                      Waiting: --
                    </p>
                    <p className="dept-meta">Avg wait: -- min</p>
                    <div className="dept-card-footer">
                      <button className="btn btn-sm">View Queue</button>
                      {/* admin controls placeholder */}
                    </div>
                  </div>
                ))}

                {departments.length === 0 && !loading && (
                  <p className="hint-text">No departments found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Insights Tab — placeholder, not built yet */}
        {activeTab === "ai" && (
          <div className="ai-section">
            <div className="section-header">
              <h2>AI Insights</h2>
            </div>
            <div className="ai-placeholder">
              <div className="ai-placeholder-icon">⚙</div>
              <p>AI prediction module is under development.</p>
              <p className="hint-text">
                This section will show wait time predictions and queue
                recommendations.
              </p>
              {/* TODO: hook up aiPredictionService */}
              <button className="btn btn-primary" disabled>
                Run Prediction
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {/* TODO: build footer component */}
    </div>
  );
}

export default App;
