import cors from "cors";
import express from "express";
import { clerkMiddleware } from "@clerk/express";

import { limiter } from "./config";
import { apiRoutes } from "./routes";

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());
app.use(clerkMiddleware());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use("/api", apiRoutes);

export default app;