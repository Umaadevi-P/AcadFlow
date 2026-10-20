import express from "express";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

/**
 * Builds the Express application without starting it or connecting to the
 * database. Keeping this separate from index.js lets tests create the app and
 * drive it against an in-memory database.
 */
export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: env.clientUrls,
      credentials: true,
    }),
  );
  if (env.isDev) app.use(morgan("dev"));

  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, time: new Date().toISOString() }),
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/requests", requestRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
