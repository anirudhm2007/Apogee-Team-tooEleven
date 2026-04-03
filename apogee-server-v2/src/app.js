const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const departmentRoutes = require("./routes/departmentRoutes");
const patientRoutes = require("./routes/patientRoutes");
const queueRoutes = require("./routes/queueRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocal =
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      /^https?:\/\/192\.168\./.test(origin) ||
      /^https?:\/\/10\./.test(origin) ||
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./.test(origin);
    if (isLocal) return callback(null, true);
    callback(new Error("CORS: origin not allowed"));
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() })
);

app.use("/api/departments", departmentRoutes);
app.use("/api/patient",     patientRoutes);
app.use("/api/queue",       queueRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/ai",          aiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
