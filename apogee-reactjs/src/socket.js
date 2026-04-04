import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000,
  autoConnect: true,
});

socket.on("connect", () =>
  console.log("✅ Socket connected:", socket.id, "→", SOCKET_URL)
);
socket.on("connect_error", (err) =>
  console.error("❌ Socket error:", err.message)
);
socket.on("disconnect", (reason) =>
  console.warn("⚠️ Socket disconnected:", reason)
);

export default socket;
