require("dotenv").config();
console.log("GROQ KEY:", process.env.GROQ_API_KEY);

const http = require("http");
const os = require("os");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");
// const { seedInitialData } = require("./src/services/seedService");

const PORT = process.env.PORT || 5000;

const printNetworkURLs = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`🌐 Network: http://${net.address}:${PORT}`);
      }
    }
  }
};

const start = async () => {
  await connectDB();
  // await seedInitialData();

  const server = http.createServer(app);
  initSocket(server);

  // "0.0.0.0" = listen on ALL interfaces (WiFi, LAN, localhost)
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Apogee server running`);
    console.log(`💻 Local:   http://localhost:${PORT}`);
    printNetworkURLs();
  });
};

start().catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});
