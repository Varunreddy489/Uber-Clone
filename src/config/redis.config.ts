import Redis from "ioredis";

// Create a new ioredis instance (auto-connects)
export const redisClient = new Redis({
  port: 6379, // Redis port
  host: "127.0.0.1", // Redis host
});

// Error handling
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

redisClient.on("ready", () => {
  console.log("Redis client ready");
});

redisClient.on("end", () => {
  console.log("Redis client disconnected");
});
