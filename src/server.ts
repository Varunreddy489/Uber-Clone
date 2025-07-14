import http from "http";
import app from "./app";
import { logger, PORT } from "./config";

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  logger.info(`Server is running on port ${PORT}`);
});