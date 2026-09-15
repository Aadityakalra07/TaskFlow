require("dotenv").config();
const setupSocket = require("./sockets/socket");
const { Server } = require("socket.io");
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    const server = http.createServer(app);
    const io = new Server(server,{
        cors:{
            origin : "http://localhost:5173"
        }
    });
    await setupSocket(io);
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};
startServer();
