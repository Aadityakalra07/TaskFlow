const { redisClient } = require("../config/redis");

const setupSocket = async (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  const subscriber = redisClient.duplicate();

  await subscriber.connect();

  await subscriber.subscribe("job-updates", (message) => {
    console.log("Received job update:", message);

    const data = JSON.parse(message);

    console.log("Sending job update to clients:", data);

    io.emit("job:updated", data);
  });
};

module.exports = setupSocket;
