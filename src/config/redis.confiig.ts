import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://localhost:6380",
});

redisClient.connect().catch(console.error);

redisClient.on("error", (err) => console.error("Redis Client Error", err));
