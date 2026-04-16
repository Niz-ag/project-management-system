import express from "express";
import cors from "cors";

const app = express();

//boiler-plate for express
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "https://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// routes

import healthCheckRouter from "./routes/healthcheck.route.js";
app.use("/api/v1/healthcheck", healthCheckRouter);

export default app;
