import { Server } from "socket.io";
import { DriverLocation } from "../utils/common";
import { logger, prisma } from "../config";

const driversLocationMap = new Map<string, DriverLocation>();
export const initSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("driverLocationUpdate", async (data: DriverLocation) => {
      if (!data.driverId) {
        console.error("Driver ID is required for location updates");
        return;
      }

      driversLocationMap.set(data.driverId, data);
      console.log(`Driver ${data.driverId} location updated:`, data);

      try {
        await prisma.driver.update({
          where: { id: data.driverId },
          data: {
            curr_latitude: data.latitude,
            curr_longitude: data.longitude,
          },
        });

        // Emit the updated location to all connected clients
        io.emit("driverLocationUpdate", data);
      } catch (error) {
        console.error("Error processing driver location update:", error);
        logger.error("Error processing driver location update:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};
