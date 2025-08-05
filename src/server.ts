import http from "http";
import app from "./app";
import { logger, PORT } from "./config";
import { Server } from "socket.io";
import { initSocket } from "./socket";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  logger.info(`Server is running on port ${PORT}`);
});
