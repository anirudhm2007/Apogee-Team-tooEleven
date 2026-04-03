const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isLocal =
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          /^https?:\/\/192\.168\./.test(origin) ||
          /^https?:\/\/10\./.test(origin) ||
          /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./.test(origin);
        if (isLocal) return callback(null, true);
        callback(new Error("Socket CORS: origin not allowed"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(` Device connected: ${socket.id} from ${socket.handshake.address}`);
    socket.on("disconnect", () => {
      console.log(` Device disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };
