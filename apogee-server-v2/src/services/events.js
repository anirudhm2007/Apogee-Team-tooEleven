function emitRealtimeState(io, payload) {
  if (payload.queueOverview) {
    io.emit("queue:updated", payload.queueOverview);
  }
  if (payload.stats) {
    io.emit("stats:updated", payload.stats);
  }
  if (payload.token) {
    io.emit("token:updated", payload.token);

    if (payload.token.predictedWaitMins > 0 && payload.token.predictedWaitMins <= 5) {
      io.emit("notification", {
        tokenId: payload.token.tokenId,
        message: "Your turn in 5 minutes",
      });
    }
    if (payload.token.assignedRoom) {
      io.emit("notification", {
        tokenId: payload.token.tokenId,
        message: `Proceed to Room ${payload.token.assignedRoom}`,
      });
    }
  }
  if (payload.notification) {
    io.emit("notification", payload.notification);
  }
}

module.exports = { emitRealtimeState };
