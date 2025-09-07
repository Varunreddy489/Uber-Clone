import http from "http";
import app from "./app";
import { Server } from "socket.io";
import { initSocket } from "./socket";
import { logger, serverConfig } from "./config";
import { swaggerDocs } from "./helper/swagger";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

initSocket(io);

const PORT = serverConfig.PORT;

server.listen(PORT, () => {
  swaggerDocs(app, PORT);
  console.log(`Server is running on port ${PORT}`);
  logger.info(`Server is running on port ${PORT}`);
});
